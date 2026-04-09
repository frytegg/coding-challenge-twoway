# PromptVault

A Pinterest-style platform for discovering, saving, and sharing LLM prompts.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/prompt-vault.git
cd prompt-vault

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Set up the database
npx prisma migrate dev
npx prisma db seed

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Prisma + SQLite (dev) / PostgreSQL (prod)
- NextAuth.js v5
- Tailwind CSS + shadcn/ui
- Vitest + Playwright
