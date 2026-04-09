// ─── Types ──────────────────────────────────────────────────────

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

interface RateLimitEntry {
  timestamps: number[];
}

// eslint-disable-next-line no-unused-vars
type RateLimitChecker = (request: Request) => Promise<RateLimitResult>;

// ─── Factory ────────────────────────────────────────────────────

export function rateLimit(options: RateLimitOptions): RateLimitChecker {
  const { windowMs, maxRequests } = options;
  const store = new Map<string, RateLimitEntry>();

  // Cleanup stale entries every 60 seconds to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      const recent = entry.timestamps.filter((ts) => now - ts < windowMs);
      if (recent.length === 0) {
        store.delete(key);
      } else {
        entry.timestamps = recent;
      }
    }
  }, 60_000);

  // Allow the process to exit without waiting for the interval
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return async (request: Request): Promise<RateLimitResult> => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0].trim() || 'anonymous';

    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = store.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(ip, entry);
    }

    // Filter out timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const resetAt = new Date(now + windowMs);

    if (entry.timestamps.length >= maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt,
      };
    }

    entry.timestamps.push(now);

    return {
      success: true,
      remaining: maxRequests - entry.timestamps.length,
      resetAt,
    };
  };
}

// ─── Pre-configured Limiters ────────────────────────────────────

/** Login / OAuth sign-in: 10 req / 60s per IP */
export const authLimiter = rateLimit({ windowMs: 60_000, maxRequests: 10 });

/** Registration: 5 req / 60s per IP */
export const registerLimiter = rateLimit({ windowMs: 60_000, maxRequests: 5 });

/** Create / update / delete / star: 20 req / 60s per IP */
export const mutationLimiter = rateLimit({ windowMs: 60_000, maxRequests: 20 });
