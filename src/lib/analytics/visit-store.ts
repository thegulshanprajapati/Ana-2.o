'use server';

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

import { getMongoDb, isMongoConfigured } from '@/lib/mongodb';

import { getMongoClient } from '@/lib/mongodb';

let useMongoBackend =
  process.env.ANA_DATA_BACKEND === 'mongodb' || isMongoConfigured();

if (useMongoBackend) {
  getMongoClient().catch((err) => {
    console.warn('[Analytics] MongoDB connection check failed on startup. Falling back to local files.', err.message || err);
    useMongoBackend = false;
  });
}

const analyticsDir = path.join(process.cwd(), 'local-data', 'analytics');
const visitsFilePath = path.join(analyticsDir, 'page-visits.json');
const liveSessionsFilePath = path.join(analyticsDir, 'live-sessions.json');

const VISITS_COLLECTION = 'page_visit_events';
const LIVE_SESSIONS_COLLECTION = 'live_sessions';

const LIVE_WINDOW_MS = 2 * 60 * 1000;
const LIVE_RETENTION_MS = 24 * 60 * 60 * 1000;

let mongoIndexesPromise: Promise<void> | null = null;

export interface PageVisitEvent {
  id: string;
  path: string;
  sessionId: string;
  userId?: string | null;
  visitorKey: string;
  createdAt: string;
  dateKey: string;
}

export interface LiveSessionRecord {
  sessionId: string;
  userId?: string | null;
  visitorKey: string;
  currentPath: string;
  lastSeenAt: string;
}

export interface VisitSummaryByPage {
  path: string;
  visits: number;
}

export interface VisitAnalyticsSummary {
  selectedDate: string;
  visitsOnDate: number;
  uniqueVisitorsOnDate: number;
  totalVisits: number;
  totalUniqueVisitors: number;
  liveUsers: number;
  byPageOnDate: VisitSummaryByPage[];
}

interface RecordVisitInput {
  path: string;
  sessionId: string;
  userId?: string | null;
}

const dateKeyFromIso = (iso: string): string => iso.slice(0, 10);

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizePath = (value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw) {
    return '/';
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
};

const normalizeUserId = (value: unknown): string | null => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const normalizeSessionId = (value: unknown): string => normalizeText(value);

const getVisitorKey = (userId: string | null, sessionId: string): string =>
  userId || sessionId;

const ensureDir = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

const readJsonFile = async <T>(filePath: string, defaultValue: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    throw error;
  }
};

const writeJsonFile = async <T>(filePath: string, data: T): Promise<void> => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const pruneLocalLiveSessions = (
  sessions: LiveSessionRecord[],
  nowMs: number
): LiveSessionRecord[] => {
  const minMs = nowMs - LIVE_RETENTION_MS;
  return sessions.filter((session) => {
    const seenMs = new Date(session.lastSeenAt).getTime();
    return Number.isFinite(seenMs) && seenMs >= minMs;
  });
};

const upsertLocalLiveSession = (
  sessions: LiveSessionRecord[],
  incoming: LiveSessionRecord
): LiveSessionRecord[] => {
  const nextSessions = [...sessions];
  const index = nextSessions.findIndex(
    (session) => session.sessionId === incoming.sessionId
  );
  if (index === -1) {
    nextSessions.push(incoming);
  } else {
    nextSessions[index] = incoming;
  }
  return nextSessions;
};

const ensureMongoIndexes = async (): Promise<void> => {
  if (!useMongoBackend) {
    return;
  }

  if (!mongoIndexesPromise) {
    mongoIndexesPromise = (async () => {
      const db = await getMongoDb();
      await Promise.all([
        db
          .collection<PageVisitEvent>(VISITS_COLLECTION)
          .createIndex({ createdAt: -1 }),
        db
          .collection<PageVisitEvent>(VISITS_COLLECTION)
          .createIndex({ dateKey: 1, path: 1 }),
        db
          .collection<PageVisitEvent>(VISITS_COLLECTION)
          .createIndex({ visitorKey: 1 }),
        db
          .collection<LiveSessionRecord>(LIVE_SESSIONS_COLLECTION)
          .createIndex({ sessionId: 1 }, { unique: true }),
        db
          .collection<LiveSessionRecord>(LIVE_SESSIONS_COLLECTION)
          .createIndex({ lastSeenAt: -1 }),
      ]);
    })();
  }

  await mongoIndexesPromise;
};

const updateLivePresence = async (input: RecordVisitInput): Promise<void> => {
  const sessionId = normalizeSessionId(input.sessionId);
  if (!sessionId) {
    return;
  }

  const pathName = normalizePath(input.path);
  const userId = normalizeUserId(input.userId);
  const visitorKey = getVisitorKey(userId, sessionId);
  const nowIso = new Date().toISOString();

  if (useMongoBackend) {
    await ensureMongoIndexes();
    const db = await getMongoDb();

    await db.collection<LiveSessionRecord>(LIVE_SESSIONS_COLLECTION).updateOne(
      { sessionId },
      {
        $set: {
          sessionId,
          userId,
          visitorKey,
          currentPath: pathName,
          lastSeenAt: nowIso,
        },
      },
      { upsert: true }
    );

    const staleCutoffIso = new Date(Date.now() - LIVE_RETENTION_MS).toISOString();
    await db
      .collection<LiveSessionRecord>(LIVE_SESSIONS_COLLECTION)
      .deleteMany({ lastSeenAt: { $lt: staleCutoffIso } });
    return;
  }

  await ensureDir(analyticsDir);
  const existing = await readJsonFile<LiveSessionRecord[]>(liveSessionsFilePath, []);
  const pruned = pruneLocalLiveSessions(existing, Date.now());
  const next = upsertLocalLiveSession(pruned, {
    sessionId,
    userId,
    visitorKey,
    currentPath: pathName,
    lastSeenAt: nowIso,
  });
  await writeJsonFile(liveSessionsFilePath, next);
};

export const recordPageVisit = async (input: RecordVisitInput): Promise<void> => {
  const sessionId = normalizeSessionId(input.sessionId);
  if (!sessionId) {
    return;
  }

  const pathName = normalizePath(input.path);
  const userId = normalizeUserId(input.userId);
  const nowIso = new Date().toISOString();
  const event: PageVisitEvent = {
    id: randomUUID(),
    path: pathName,
    sessionId,
    userId,
    visitorKey: getVisitorKey(userId, sessionId),
    createdAt: nowIso,
    dateKey: dateKeyFromIso(nowIso),
  };

  if (useMongoBackend) {
    await ensureMongoIndexes();
    const db = await getMongoDb();
    await db.collection<PageVisitEvent>(VISITS_COLLECTION).insertOne(event);
  } else {
    await ensureDir(analyticsDir);
    const visits = await readJsonFile<PageVisitEvent[]>(visitsFilePath, []);
    visits.push(event);
    await writeJsonFile(visitsFilePath, visits);
  }

  await updateLivePresence({
    path: pathName,
    sessionId,
    userId,
  });
};

export const recordSessionHeartbeat = async (
  input: RecordVisitInput
): Promise<void> => {
  await updateLivePresence(input);
};

const normalizeDateKey = (dateKey: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return dateKey;
  }
  return new Date().toISOString().slice(0, 10);
};

export const getVisitAnalyticsSummary = async (
  dateKey: string
): Promise<VisitAnalyticsSummary> => {
  const selectedDate = normalizeDateKey(dateKey);
  const liveCutoffIso = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();

  if (useMongoBackend) {
    await ensureMongoIndexes();
    const db = await getMongoDb();
    const visitsCollection = db.collection<PageVisitEvent>(VISITS_COLLECTION);
    const liveCollection = db.collection<LiveSessionRecord>(LIVE_SESSIONS_COLLECTION);

    const staleCutoffIso = new Date(Date.now() - LIVE_RETENTION_MS).toISOString();
    await liveCollection.deleteMany({ lastSeenAt: { $lt: staleCutoffIso } });

    const countUniqueVisitors = async (
      matchStage: Record<string, unknown>
    ): Promise<number> => {
      const rows = await visitsCollection
        .aggregate<{ count: number }>([
          { $match: matchStage },
          { $group: { _id: '$visitorKey' } },
          { $count: 'count' },
        ])
        .toArray();
      return rows[0]?.count ?? 0;
    };

    const [
      visitsOnDate,
      uniqueVisitorsOnDate,
      totalVisits,
      totalUniqueVisitors,
      liveUsers,
      byPageOnDate,
    ] = await Promise.all([
      visitsCollection.countDocuments({ dateKey: selectedDate }),
      countUniqueVisitors({ dateKey: selectedDate }),
      visitsCollection.countDocuments({}),
      countUniqueVisitors({}),
      liveCollection.countDocuments({ lastSeenAt: { $gte: liveCutoffIso } }),
      visitsCollection
        .aggregate<VisitSummaryByPage>([
          { $match: { dateKey: selectedDate } },
          {
            $group: {
              _id: '$path',
              visits: { $sum: 1 },
            },
          },
          { $sort: { visits: -1, _id: 1 } },
          {
            $project: {
              _id: 0,
              path: '$_id',
              visits: 1,
            },
          },
          { $limit: 100 },
        ])
        .toArray(),
    ]);

    return {
      selectedDate,
      visitsOnDate,
      uniqueVisitorsOnDate,
      totalVisits,
      totalUniqueVisitors,
      liveUsers,
      byPageOnDate,
    };
  }

  await ensureDir(analyticsDir);
  const [allVisits, existingLiveSessions] = await Promise.all([
    readJsonFile<PageVisitEvent[]>(visitsFilePath, []),
    readJsonFile<LiveSessionRecord[]>(liveSessionsFilePath, []),
  ]);

  const prunedLiveSessions = pruneLocalLiveSessions(
    existingLiveSessions,
    Date.now()
  );
  if (prunedLiveSessions.length !== existingLiveSessions.length) {
    await writeJsonFile(liveSessionsFilePath, prunedLiveSessions);
  }

  const visitsOnDateEvents = allVisits.filter(
    (event) => event.dateKey === selectedDate
  );
  const byPageMap = new Map<string, number>();

  for (const event of visitsOnDateEvents) {
    byPageMap.set(event.path, (byPageMap.get(event.path) ?? 0) + 1);
  }

  const byPageOnDate = Array.from(byPageMap.entries())
    .map(([pathName, visits]) => ({ path: pathName, visits }))
    .sort((a, b) => b.visits - a.visits || a.path.localeCompare(b.path))
    .slice(0, 100);

  const uniqueVisitorsOnDate = new Set(
    visitsOnDateEvents.map((event) => event.visitorKey)
  );
  const totalUniqueVisitors = new Set(allVisits.map((event) => event.visitorKey));
  const liveUsers = prunedLiveSessions.filter(
    (session) => session.lastSeenAt >= liveCutoffIso
  ).length;

  return {
    selectedDate,
    visitsOnDate: visitsOnDateEvents.length,
    uniqueVisitorsOnDate: uniqueVisitorsOnDate.size,
    totalVisits: allVisits.length,
    totalUniqueVisitors: totalUniqueVisitors.size,
    liveUsers,
    byPageOnDate,
  };
};
