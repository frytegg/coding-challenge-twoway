import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

function makeRequest(ip: string = '127.0.0.1'): Request {
  return new Request('http://localhost:3000/api/test', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns { success: true } with correct remaining count within limit', async () => {
    const check = rateLimit({ windowMs: 10_000, maxRequests: 3 });
    const req = makeRequest();

    const result1 = await check(req);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = await check(req);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = await check(req);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('returns { success: false } after exceeding maxRequests', async () => {
    const check = rateLimit({ windowMs: 10_000, maxRequests: 2 });
    const req = makeRequest();

    await check(req); // 1st
    await check(req); // 2nd — at limit

    const result = await check(req); // 3rd — over limit
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBeInstanceOf(Date);
    expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('resets after windowMs has elapsed', async () => {
    const windowMs = 5_000;
    const check = rateLimit({ windowMs, maxRequests: 1 });
    const req = makeRequest();

    const result1 = await check(req);
    expect(result1.success).toBe(true);

    // Should be blocked now
    const result2 = await check(req);
    expect(result2.success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1);

    // Should be allowed again
    const result3 = await check(req);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('tracks different IPs independently', async () => {
    const check = rateLimit({ windowMs: 10_000, maxRequests: 1 });

    const res1 = await check(makeRequest('1.1.1.1'));
    expect(res1.success).toBe(true);

    // Same IP — blocked
    const res2 = await check(makeRequest('1.1.1.1'));
    expect(res2.success).toBe(false);

    // Different IP — allowed
    const res3 = await check(makeRequest('2.2.2.2'));
    expect(res3.success).toBe(true);
  });
});
