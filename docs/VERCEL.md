# Deploying MedicalPrep on Vercel

SQLite (`file:./dev.db`) does **not** work on Vercel. Use hosted Postgres (Neon is free-tier friendly).

## 1. Create a Neon database

1. In the [Vercel dashboard](https://vercel.com) → your project → **Storage** → create **Neon Postgres**,  
   **or** create a project at [console.neon.tech](https://console.neon.tech).
2. Copy both connection strings:
   - **Pooled** → `DATABASE_URL`
   - **Direct** (non-pooled) → `DIRECT_URL`  
   If you only have one string, set both vars to the same value.

## 2. Environment variables

**Settings → Environment Variables** (Production + Preview):

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Neon pooled Postgres URL |
| `DIRECT_URL` | Neon direct Postgres URL (migrations) |
| `AUTH_SECRET` | Long random string |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | optional |

## 3. Redeploy

After saving env vars, **Redeploy** the latest deployment. The build runs `prisma migrate deploy` to create tables.

## 4. Seed drug catalog (optional)

From your machine (with `DATABASE_URL` / `DIRECT_URL` pointing at Neon):

```bash
npm run db:seed
```

## Firebase API key note

The server verifies ID tokens with the web API key. In Google Cloud → APIs & Services → Credentials, do not restrict that key to HTTP referrers only (or use a key that allows the Identity Toolkit API from server IPs).
