import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockDelete = vi.fn();
const mockStarFindMany = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    prompt: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    star: {
      findMany: (...args: unknown[]) => mockStarFindMany(...args),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

const mockGetSessionUser = vi.fn();
vi.mock('@/lib/auth-guard', () => ({
  getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  mutationLimiter: vi.fn().mockResolvedValue({ success: true, remaining: 19, resetAt: new Date() }),
}));

vi.mock('@/app/generated/prisma/client', () => ({
  Prisma: {},
}));

// ── Helpers ────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// ── Tests: GET /api/prompts ────────────────────────────────────

describe('GET /api/prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStarFindMany.mockResolvedValue([]);
  });

  it('returns data in { data, meta: { page, limit, total } } shape', async () => {
    const mockPrompts = [
      {
        id: '1',
        title: 'Test Prompt',
        body: 'Hello world',
        starCount: 0,
        isPublic: true,
        authorId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: 'user-1', name: 'Alice', image: null },
        tags: [],
        _count: { stars: 0 },
      },
    ];
    mockFindMany.mockResolvedValue(mockPrompts);
    mockCount.mockResolvedValue(1);

    const { GET } = await import('@/app/api/prompts/route');
    const req = makeRequest('http://localhost:3000/api/prompts');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty('data');
    expect(json).toHaveProperty('meta');
    expect(json.meta).toHaveProperty('page');
    expect(json.meta).toHaveProperty('limit');
    expect(json.meta).toHaveProperty('total');
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
  });

  it('filters results when ?q=code is provided', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const { GET } = await import('@/app/api/prompts/route');
    const req = makeRequest('http://localhost:3000/api/prompts?q=code');
    await GET(req);

    // Verify the where clause was called with the search term
    const whereArg = mockFindMany.mock.calls[0][0].where;
    expect(whereArg).toHaveProperty('isPublic', true);
    expect(whereArg).toHaveProperty('OR');
    expect(whereArg.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'code' } }),
        expect.objectContaining({ body: { contains: 'code' } }),
      ])
    );
  });
});

// ── Tests: POST /api/prompts ───────────────────────────────────

describe('POST /api/prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const { POST } = await import('@/app/api/prompts/route');
    const req = makeRequest('http://localhost:3000/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', body: 'Hello', tags: [] }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });
});

// ── Tests: DELETE /api/prompts/:id ─────────────────────────────

describe('DELETE /api/prompts/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when a non-owner attempts deletion', async () => {
    // Authenticated as user-2, but the prompt belongs to user-1
    mockGetSessionUser.mockResolvedValue({
      userId: 'user-2',
      name: 'Bob',
      email: 'bob@test.com',
      image: '',
    });

    mockFindUnique.mockResolvedValue({
      id: 'prompt-1',
      title: 'Test',
      body: 'Hello',
      authorId: 'user-1',
      starCount: 0,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { DELETE } = await import('@/app/api/prompts/[id]/route');
    const req = makeRequest('http://localhost:3000/api/prompts/prompt-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'prompt-1' }),
    });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe('FORBIDDEN');
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
