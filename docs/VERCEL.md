# Deploying MedicalPrep on Vercel

This app uses **PostgreSQL** (via Prisma). Set a hosted Postgres connection string in Vercel — local SQLite is not supported.

## Required environment variables

**Vercel → Project → Settings → Environment Variables** (Production + Preview):

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres URL (pooled URL if your host offers one) |
| `DIRECT_URL` | Direct URL for migrations. Same as `DATABASE_URL` if you only have one. |
| `AUTH_SECRET` | Long random string (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_FIREBASE_*` | Same values as local `.env.local` |

Push the latest code, then **Redeploy**. The build runs `prisma migrate deploy`.

## Supabase (free Postgres)

1. [supabase.com](https://supabase.com) → **New project** → set a DB password.
2. **Project Settings → Database → Connection string → URI**.
3. Replace `[YOUR-PASSWORD]` in the URI with your password.
4. Set that URI as both `DATABASE_URL` and `DIRECT_URL` on Vercel (plus Firebase + `AUTH_SECRET`).
5. Redeploy.

## Railway / Render Postgres

Create a Postgres service, copy the URL into `DATABASE_URL` and `DIRECT_URL`, redeploy.

## Seed data (optional)

With Postgres URLs in local `.env`:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Firebase API key note

Server session creation uses the web API key against Identity Toolkit. Don’t restrict that key to HTTP referrers only.
