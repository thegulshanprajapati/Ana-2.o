const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;

const requestTimestampsByUser = new Map<string, number[]>();

const cleanupRateLimitMap = (now: number): void => {
  if (requestTimestampsByUser.size < 5000) {
    return;
  }

  for (const [userId, timestamps] of requestTimestampsByUser.entries()) {
    const recentTimestamps = timestamps.filter(
      (timestamp) => now - timestamp <= RATE_LIMIT_WINDOW_MS
    );

    if (recentTimestamps.length === 0) {
      requestTimestampsByUser.delete(userId);
      continue;
    }

    requestTimestampsByUser.set(userId, recentTimestamps);
  }
};

export const isRateLimited = (userId: string, now = Date.now()): boolean => {
  cleanupRateLimitMap(now);

  const timestamps = requestTimestampsByUser.get(userId) ?? [];
  const recentTimestamps = timestamps.filter(
    (timestamp) => now - timestamp <= RATE_LIMIT_WINDOW_MS
  );

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestTimestampsByUser.set(userId, recentTimestamps);
    return true;
  }

  recentTimestamps.push(now);
  requestTimestampsByUser.set(userId, recentTimestamps);
  return false;
};
