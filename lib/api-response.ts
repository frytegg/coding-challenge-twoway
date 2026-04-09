import { NextResponse } from 'next/server';

// ─── Types ──────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

// ─── Success Helpers ────────────────────────────────────────────

export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data, meta }, { status: 200 });
}

export function createdResponse<T>(
  data: T,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status: 201 });
}

// ─── Error Helper ───────────────────────────────────────────────

export function errorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}

// ─── Common Error Factories ─────────────────────────────────────

export function notFound(
  message = 'Resource not found',
): NextResponse<ApiErrorBody> {
  return errorResponse('NOT_FOUND', message, 404);
}

export function unauthorized(
  message = 'Authentication required',
): NextResponse<ApiErrorBody> {
  return errorResponse('UNAUTHORIZED', message, 401);
}

export function forbidden(
  message = 'Insufficient permissions',
): NextResponse<ApiErrorBody> {
  return errorResponse('FORBIDDEN', message, 403);
}

export function badRequest(
  message = 'Invalid request',
): NextResponse<ApiErrorBody> {
  return errorResponse('BAD_REQUEST', message, 400);
}

export function rateLimited(resetAt: Date): NextResponse<ApiErrorBody> {
  const retryAfter = Math.max(
    1,
    Math.ceil((resetAt.getTime() - Date.now()) / 1000),
  );
  return NextResponse.json(
    { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}
