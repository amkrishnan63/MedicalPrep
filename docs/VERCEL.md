# Deploy to Vercel

## 1. Env vars (Vercel → Settings → Environment Variables)

Add for **Production** and **Preview**:

| Variable | Where to get it |
| --- | --- |
| `DATABASE_URL` | Postgres URI (`postgresql://...`) from your DB host |
| `DIRECT_URL` | Same URI, or the “direct” URI if two are shown |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase console → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | optional |

**Supabase:** open the project → top **Connect** → **ORMs / Prisma** or **Connection string → URI**.  
Copy the `postgresql://...` string (not `NEXT_PUBLIC_SUPABASE_*`).

## 2. Deploy

Push to `main` (or Redeploy). Build runs `prisma migrate deploy` then `next build`.

## 3. Seed (optional, from your laptop)

Put the same `DATABASE_URL` / `DIRECT_URL` in local `.env`, then:

```bash
npx prisma migrate deploy
npm run db:seed
```
