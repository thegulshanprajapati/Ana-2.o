import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getUserById } from '@/lib/local-data';
import { isAdminEmail } from '@/lib/auth/admin';
import {
  getVisitAnalyticsSummary,
  recordPageVisit,
  recordSessionHeartbeat,
} from '@/lib/analytics/visit-store';

export const runtime = 'nodejs';

interface AnalyticsTrackBody {
  path?: string;
  sessionId?: string;
  userId?: string | null;
  type?: 'visit' | 'heartbeat';
}

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizePath = (value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw) {
    return '/';
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
};

const isValidDateKey = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

const buildEmptySummary = (selectedDate: string) => ({
  selectedDate,
  visitsOnDate: 0,
  uniqueVisitorsOnDate: 0,
  totalVisits: 0,
  totalUniqueVisitors: 0,
  liveUsers: 0,
  byPageOnDate: [],
});

const resolveAdminAccess = async (
  userId: string,
  adminEmail?: string
): Promise<boolean> => {
  if (isAdminEmail(adminEmail)) {
    return true;
  }

  if (!userId) {
    return false;
  }

  try {
    const user = await getUserById(userId);
    return isAdminEmail(user?.email);
  } catch (error) {
    console.error('[api/analytics] admin_resolution_failed', error);
    return false;
  }
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as AnalyticsTrackBody;
    const sessionId = normalizeText(body.sessionId);
    const pathName = normalizePath(body.path);
    const userId = normalizeText(body.userId) || null;
    const type = body.type === 'heartbeat' ? 'heartbeat' : 'visit';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required.' },
        { status: 400 }
      );
    }

    if (type === 'heartbeat') {
      await recordSessionHeartbeat({
        sessionId,
        path: pathName,
        userId,
      });
    } else {
      await recordPageVisit({
        sessionId,
        path: pathName,
        userId,
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[api/analytics] post_failed', error);
    return NextResponse.json({ error: 'Failed to track analytics.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const adminUserId = normalizeText(url.searchParams.get('adminUserId'));
    const adminEmail = normalizeText(url.searchParams.get('adminEmail'));
    const requestedDate = normalizeText(url.searchParams.get('date'));

    const isAdmin = await resolveAdminAccess(adminUserId, adminEmail);
    if (!isAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const selectedDate = isValidDateKey(requestedDate)
      ? requestedDate
      : new Date().toISOString().slice(0, 10);

    let summary = buildEmptySummary(selectedDate);
    try {
      summary = await getVisitAnalyticsSummary(selectedDate);
    } catch (summaryError) {
      console.error('[api/analytics] summary_failed', summaryError);
    }
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('[api/analytics] get_failed', error);
    const fallbackDate = new Date().toISOString().slice(0, 10);
    return NextResponse.json(buildEmptySummary(fallbackDate), { status: 200 });
  }
}
