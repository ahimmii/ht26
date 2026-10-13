type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const DEFAULT_WINDOW_MS = 60_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs = DEFAULT_WINDOW_MS,
) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    buckets.set(key, next);
    return { ok: true, remaining: limit - 1, resetAt: next.resetAt };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return {
    ok: true,
    remaining: limit - current.count,
    resetAt: current.resetAt,
  };
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return {
    error: "Too many requests. Please wait and try again.",
    retryAfter,
  };
}
