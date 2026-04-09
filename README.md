# PromptVault

A Pinterest-for-prompts web app to save, search, and share your favorite LLM prompts.

Built as a full-stack coding challenge demonstrating end-to-end product delivery: schema design, authentication, CRUD, search, real-time UX, testing, CI/CD, and accessibility.

## Features

**Core**

- Create, read, update, and delete prompts with a rich markdown editor and live preview
- Full-text search across titles and body content
- Tag-based filtering with a horizontally scrollable tag bar
- Copy-to-clipboard on both prompt cards and detail pages
- Infinite scroll with intersection observer pagination

**Authentication**

- Google OAuth and GitHub OAuth via NextAuth v5
- Email + password sign-in with bcrypt hashing
- Email verification flow (console-logged in dev, SMTP-ready for production)
- Rate limiting on auth and mutation endpoints (sliding-window, IP-keyed)

**Social**

- Star/upvote prompts with optimistic UI updates and server reconciliation
- Sort by recency or popularity (star count)
- Public shareable URLs with Open Graph and Twitter Card meta tags
- JSON-LD structured data for SEO

**UX**

- Dark mode with system preference detection and three-way toggle (system/light/dark)
- Keyboard shortcuts: `Ctrl+K` focus search, `Ctrl+N` new prompt, `Ctrl+D` cycle theme, `Esc` blur/close
- Responsive design: mobile hamburger menu, fluid grid, touch-friendly controls
- Accessible: ARIA dialogs, focus-visible rings on all interactive elements, screen-reader labels

**Developer Experience**

- TypeScript strict mode throughout
- ESLint + Prettier with zero warnings
- Vitest unit/integration tests + Playwright end-to-end tests
- GitHub Actions CI pipeline (lint, typecheck, unit tests, e2e tests)
- Vercel preview deploys on every push

## Tech Stack & Decisions

| Layer           | Choice                         | Rationale                                                                                                 |
| --------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 14 (App Router)        | Server components for fast initial loads, API routes co-located with frontend, streaming/suspense support |
| Runtime         | Node.js 20                     | LTS release, native fetch, stable performance                                                             |
| Language        | TypeScript (strict)            | Catch bugs at compile time, self-documenting interfaces, better refactoring                               |
| ORM             | Prisma 5                       | Type-safe queries generated from schema, migration system, multi-database support                         |
| Database (dev)  | SQLite via better-sqlite3      | Zero setup, file-based, instant migrations for local development                                          |
| Database (prod) | PostgreSQL (Neon)              | Serverless Postgres, connection pooling, scales with Vercel's edge runtime                                |
| Auth            | NextAuth v5 (Auth.js)          | Supports OAuth + credentials in one config, JWT sessions, middleware-level route protection               |
| Styling         | Tailwind CSS 3.4 + next-themes | Utility-first for rapid iteration, built-in dark mode, no CSS-in-JS runtime cost                          |
| Markdown        | @uiw/react-md-editor           | Split-pane editor with syntax highlighting, lightweight, supports dark mode                               |
| Testing (unit)  | Vitest + React Testing Library | Fast ESM-native runner, compatible with Next.js, jsdom environment                                        |
| Testing (e2e)   | Playwright                     | Cross-browser, auto-waits, built-in assertions, screenshot-on-failure                                     |
| CI/CD           | GitHub Actions + Vercel        | Automated lint/test/build pipeline, preview deploys per PR                                                |

## Quick Start

```bash
git clone https://github.com/frytegg/coding-challenge-twoway.git
cd coding-challenge-twoway
cp .env.example .env.local  # fill in OAuth credentials (optional — credentials auth works without them)
pnpm install
npx prisma migrate dev
npx prisma db seed
pnpm dev  # → http://localhost:3000
```

The seed script creates two demo users (`alice@demo.com` / `bob@demo.com`, password: `password123`) and eight sample prompts with tags and stars.

## Environment Variables

| Variable               | Description                                                                     | Required |
| ---------------------- | ------------------------------------------------------------------------------- | -------- |
| `DATABASE_URL`         | Prisma connection string. Defaults to `file:./dev.db` (SQLite)                  | No       |
| `NEXTAUTH_URL`         | Canonical app URL, used for OAuth callbacks and OG meta                         | Yes      |
| `NEXTAUTH_SECRET`      | Random 32+ char string for JWT signing. Generate with `openssl rand -base64 32` | Yes      |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                                          | No       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                                      | No       |
| `GITHUB_ID`            | GitHub OAuth app client ID                                                      | No       |
| `GITHUB_SECRET`        | GitHub OAuth app client secret                                                  | No       |
| `SMTP_HOST`            | SMTP server hostname for email verification                                     | No       |
| `SMTP_PORT`            | SMTP server port (default: `587`)                                               | No       |
| `SMTP_USER`            | SMTP username                                                                   | No       |
| `SMTP_PASS`            | SMTP password                                                                   | No       |
| `EMAIL_FROM`           | Sender address for verification emails (default: `noreply@promptvault.app`)     | No       |

OAuth credentials are optional. Without them, Google/GitHub buttons will fail gracefully, and credentials-based sign-in still works.

## Architecture Overview

```
app/                    Next.js App Router pages + API routes
├── api/                REST endpoints (prompts CRUD, auth, tags, stars)
├── prompts/            Prompt pages (detail, new, edit)
├── dashboard/          Authenticated user's prompt management
components/             Reusable React components (cards, forms, navbar, dialogs)
lib/                    Shared utilities (auth config, Prisma client, rate limiter, helpers)
prisma/                 Schema, migrations, seed script
__tests__/              Vitest unit + integration tests
e2e/                    Playwright end-to-end tests
```

**Data flow:** Browser → Next.js API route → Prisma ORM → SQLite (dev) or PostgreSQL (prod) → JSON response → React Server/Client Component.

Authentication uses JWT sessions via NextAuth v5. Protected routes (`/dashboard`, `/prompts/new`, `/prompts/*/edit`) are enforced at the middleware level. API mutations check session ownership before allowing writes.

Star counts are denormalized on the `Prompt` model and updated transactionally alongside `Star` create/delete to avoid count drift.

## API Reference

| Method   | Endpoint                  | Auth  | Description                                                                                  |
| -------- | ------------------------- | ----- | -------------------------------------------------------------------------------------------- |
| `GET`    | `/api/prompts`            | No    | List prompts. Query params: `q` (search), `tag`, `sort` (`recent`\|`stars`), `page`, `limit` |
| `POST`   | `/api/prompts`            | Yes   | Create a prompt. Body: `{ title, body, tags[], isPublic }`                                   |
| `GET`    | `/api/prompts/:id`        | No    | Get a single prompt with author and tags                                                     |
| `PUT`    | `/api/prompts/:id`        | Owner | Update a prompt. Body: `{ title, body, tags[], isPublic }`                                   |
| `DELETE` | `/api/prompts/:id`        | Owner | Delete a prompt and its associated stars                                                     |
| `POST`   | `/api/prompts/:id/star`   | Yes   | Toggle star on/off. Returns `{ starred, starCount }`                                         |
| `GET`    | `/api/tags`               | No    | List all tags with prompt counts                                                             |
| `POST`   | `/api/auth/register`      | No    | Register with email + password. Body: `{ name, email, password }`                            |
| `GET`    | `/api/auth/verify?token=` | No    | Verify email address from verification link                                                  |
| `*`      | `/api/auth/[...nextauth]` | --    | NextAuth handler (OAuth flows, session, CSRF)                                                |

All responses follow `{ data, meta }` on success or `{ error: { code, message } }` on failure.

## Scripts

| Command                     | Description                     |
| --------------------------- | ------------------------------- |
| `pnpm dev`                  | Start dev server on port 3000   |
| `pnpm build`                | Production build                |
| `pnpm lint`                 | ESLint check                    |
| `pnpm format`               | Prettier format all files       |
| `pnpm test`                 | Vitest unit + integration tests |
| `pnpm exec playwright test` | Playwright e2e tests            |
| `npx prisma studio`         | Database GUI                    |
| `npx prisma migrate dev`    | Run migrations                  |
| `npx prisma db seed`        | Seed demo data                  |

## Deployment (Vercel + Neon)

The project uses a dual-schema approach: `prisma/schema.prisma` (SQLite for local dev) and `prisma/schema.prod.prisma` (PostgreSQL for production). `prisma.config.ts` automatically selects the schema based on `DATABASE_URL`.

### Steps

1. **Create a Neon database** at [neon.tech](https://neon.tech) (free tier available). Copy the connection string (`postgresql://...`).

2. **Connect your GitHub repo to Vercel** at [vercel.com/new](https://vercel.com/new). Select the repository and let Vercel auto-detect Next.js.

3. **Set environment variables** in Vercel project settings → Environment Variables:

   | Variable               | Value                                                       |
   | ---------------------- | ----------------------------------------------------------- |
   | `DATABASE_URL`         | `postgresql://user:pass@host/dbname?sslmode=require` (Neon) |
   | `NEXTAUTH_URL`         | `https://your-app.vercel.app`                               |
   | `NEXTAUTH_SECRET`      | Random 32+ char string (`openssl rand -base64 32`)          |
   | `GOOGLE_CLIENT_ID`     | From Google Cloud Console (optional)                        |
   | `GOOGLE_CLIENT_SECRET` | From Google Cloud Console (optional)                        |
   | `GITHUB_ID`            | From GitHub Developer Settings (optional)                   |
   | `GITHUB_SECRET`        | From GitHub Developer Settings (optional)                   |

4. **Push the schema to Neon** (run once, locally):

   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push --schema prisma/schema.prod.prisma
   ```

5. **Deploy.** Vercel runs `pnpm install` → `postinstall` (prisma generate) → `next build` automatically.

6. **Seed production data** (optional):

   ```bash
   DATABASE_URL="postgresql://..." npx prisma db seed
   ```

### How the dual-schema works

- `prisma.config.ts` checks `DATABASE_URL` at build time
- PostgreSQL URL → uses `prisma/schema.prod.prisma` → generates PG-compatible Prisma client
- SQLite URL (or unset) → uses `prisma/schema.prisma` → generates SQLite-compatible client
- `lib/db.ts` picks the runtime adapter: SQLite driver for `file:` URLs, Prisma's built-in PG driver otherwise

## Known Limitations & Trade-offs

| Area           | Limitation                                                            | Production path                                                    |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Local dev      | No Docker Compose; relies on SQLite + `pnpm dev`                      | Docker Compose with PostgreSQL for dev/prod parity                 |
| Architecture   | No separate backend; API routes co-located in Next.js                 | Split into dedicated API service for independent scaling           |
| Star counts    | Denormalized `starCount` has a race condition under concurrent writes | Use `SELECT COUNT(*)` or a database-level trigger                  |
| Search         | Prisma `contains` (SQL `LIKE`); no ranking or relevance scoring       | Meilisearch or Elasticsearch for typo-tolerant, ranked search      |
| Authorization  | Owner vs. non-owner only; no roles or teams                           | RBAC with role-based middleware                                    |
| Rate limiting  | In-memory sliding window; resets on redeploy                          | Redis-backed rate limiter (e.g., `@upstash/ratelimit`)             |
| Email          | Console-logged in dev; no real SMTP configured                        | Resend, Postmark, or SES for transactional email                   |
| Mutations      | No full optimistic rollback on complex operations                     | React Query / SWR with mutation rollback                           |
| Loading states | No skeleton loaders; spinner only                                     | Skeleton components matching card/page layout                      |
| Media          | No image upload for prompts                                           | S3/R2 with signed upload URLs                                      |
| i18n           | English only                                                          | `next-intl` with locale routing                                    |
| Observability  | No monitoring, logging, or error tracking                             | Sentry, Datadog, or OpenTelemetry                                  |
| Caching        | Vercel defaults only; no explicit CDN or ISR strategy                 | ISR for popular prompts, Redis cache for API responses             |
| DB connections | No connection pooling configured                                      | PgBouncer or Neon's built-in pooler                                |
| Pagination     | Offset-based (`page` + `limit`)                                       | Cursor-based pagination for stable results under concurrent writes |

## What I'd Build With More Time

1. **Meilisearch integration** — sub-100ms search with typo tolerance, faceted filtering, and relevance ranking
2. **Redis-backed rate limiter** — persistent across deploys, shared across instances
3. **Docker Compose** — reproducible local dev with PostgreSQL, Redis, and Meilisearch
4. **Collections/Folders** — organize prompts into named groups, shareable as a bundle
5. **Fork/Remix** — clone someone's prompt as a starting point, with attribution link
6. **Activity feed** — see stars, new prompts, and follows in a chronological stream
7. **Cursor-based pagination** — stable ordering under concurrent writes, better infinite scroll UX
8. **Real SMTP integration** — Resend or Postmark for transactional email verification and notifications

## License

MIT
