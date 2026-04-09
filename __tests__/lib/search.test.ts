import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────

const mockFindMany = vi.fn().mockResolvedValue([]);
const mockCount = vi.fn().mockResolvedValue(0);
const mockStarFindMany = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/db', () => ({
  prisma: {
    prompt: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    star: {
      findMany: (...args: unknown[]) => mockStarFindMany(...args),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/auth-guard', () => ({
  getSessionUser: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/rate-limit', () => ({
  mutationLimiter: vi.fn().mockResolvedValue({ success: true, remaining: 19, resetAt: new Date() }),
}));

vi.mock('@/app/generated/prisma/client', () => ({
  Prisma: {},
}));

// ── Tests ──────────────────────────────────────────────────────

describe('Prompt search query builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  it('empty query returns no OR filter (fetches all public prompts)', async () => {
    const { GET } = await import('@/app/api/prompts/route');
    const req = new NextRequest(new URL('http://localhost:3000/api/prompts'));
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where).toEqual({ isPublic: true });
    expect(where).not.toHaveProperty('OR');
  });

  it('query "code" produces a filter on both title and body', async () => {
    const { GET } = await import('@/app/api/prompts/route');
    const req = new NextRequest(new URL('http://localhost:3000/api/prompts?q=code'));
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.isPublic).toBe(true);
    expect(where.OR).toBeDefined();
    expect(where.OR).toHaveLength(2);
    expect(where.OR).toContainEqual({ title: { contains: 'code' } });
    expect(where.OR).toContainEqual({ body: { contains: 'code' } });
  });

  it('tag filter adds a "some" clause', async () => {
    const { GET } = await import('@/app/api/prompts/route');
    const req = new NextRequest(new URL('http://localhost:3000/api/prompts?tag=Python'));
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.tags).toEqual({ some: { name: 'python' } });
  });

  it('combined query and tag filter produces both clauses', async () => {
    const { GET } = await import('@/app/api/prompts/route');
    const req = new NextRequest(new URL('http://localhost:3000/api/prompts?q=scrape&tag=python'));
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.isPublic).toBe(true);
    expect(where.OR).toContainEqual({ title: { contains: 'scrape' } });
    expect(where.OR).toContainEqual({ body: { contains: 'scrape' } });
    expect(where.tags).toEqual({ some: { name: 'python' } });
  });

  it('sort=stars orders by starCount descending', async () => {
    const { GET } = await import('@/app/api/prompts/route');
    const req = new NextRequest(new URL('http://localhost:3000/api/prompts?sort=stars'));
    await GET(req);

    const orderBy = mockFindMany.mock.calls[0][0].orderBy;
    expect(orderBy).toEqual({ starCount: 'desc' });
  });

  it('default sort orders by createdAt descending', async () => {
    const { GET } = await import('@/app/api/prompts/route');
    const req = new NextRequest(new URL('http://localhost:3000/api/prompts'));
    await GET(req);

    const orderBy = mockFindMany.mock.calls[0][0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });
});
