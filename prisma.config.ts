import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const url = process.env['DATABASE_URL'] ?? '';
const isPostgres = url.startsWith('postgresql://') || url.startsWith('postgres://');

export default defineConfig({
  schema: isPostgres ? 'prisma/schema.prod.prisma' : 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
