# CLAUDE.md — PromptVault

## Project Overview

PromptVault is a full-stack Next.js 14 app (App Router) — a "Pinterest for LLM prompts" with CRUD, search, tags, stars, OAuth, dark mode, and markdown editing.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** Prisma 5 + SQLite (dev) / PostgreSQL Neon (prod)
- **Auth:** NextAuth.js v5 (Google, GitHub, Credentials)
- **Styling:** Tailwind CSS 3.4 + shadcn/ui + next-themes
- **Testing:** Vitest + React Testing Library (unit/integration), Playwright (e2e)
- **CI:** GitHub Actions (lint + Vitest + Playwright) → Vercel (deploy)

## Commands

- `pnpm dev` — start dev server (port 3000)
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm format` — Prettier
- `pnpm test` — Vitest (unit + integration)
- `pnpm exec playwright test` — Playwright e2e tests
- `npx prisma studio` — DB GUI
- `npx prisma migrate dev` — run migrations
- `npx prisma db seed` — seed data

## Directory Structure

app/ # Next.js App Router pages + API routes
├── api/ # REST API endpoints
├── prompts/ # Prompt pages (detail, new, edit)
├── dashboard/ # User's prompts
components/ # Reusable React components
lib/ # Shared utilities (auth, db, api helpers, rate-limit)
prisma/ # Schema, migrations, seed
**tests**/ # Vitest unit + integration tests
e2e/ # Playwright e2e tests

## Conventions

- All API responses follow `{ data, meta }` or `{ error: { code, message } }` shape.
- Tags are stored lowercase; deduplication on create.
- Commits are atomic per phase: `feat:`, `test:`, `chore:` prefixes.
- All new components must support dark mode via Tailwind `dark:` classes.
- Star count is denormalized on `Prompt.starCount`; update in a transaction with `Star` create/delete.
- Rate limiting via in-memory sliding-window (`lib/rate-limit.ts`); keyed on IP.
- Email verification required for credentials sign-up; OAuth users auto-verified.
- Keyboard shortcuts use `Ctrl+` prefix and are focus-aware (suppressed in input/textarea).

## Environment Variables

See `.env.example` for all required variables. Critical ones:

- `DATABASE_URL` — Prisma connection string
- `NEXTAUTH_SECRET` — random 32+ char string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID` / `GITHUB_SECRET`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — optional, falls back to console.log

## Phase Tracking

When completing a phase, add a comment at the top of the PR or commit:

- **Phase N — [name]** completed [date]
- Summary: [what was done]
- Deviations: [any changes from spec]
- Metrics: [build time, test count, etc.]
