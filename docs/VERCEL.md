# Fix “Could not create app session” on Vercel

SQLite does not work on Vercel. Use a Postgres database from the Vercel dashboard.

## Step-by-step

### 1. Create a database in Vercel
1. Open your project on [vercel.com](https://vercel.com)
2. Go to the **Storage** tab
3. Click **Create Database** / **Browse Storage**
4. Choose **Neon** (Postgres) → continue → free plan → create
5. **Connect** it to this MedicalPrep project (Production + Preview)

Vercel will add env vars such as `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.

### 2. Add / fix environment variables
**Settings → Environment Variables** (Production + Preview):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Already set by Storage (pooled URL) — leave it |
| `DIRECT_URL` | Copy the value of `DATABASE_URL_UNPOOLED` (or `DATABASE_URL` if unpooled is missing) |
| `AUTH_SECRET` | Terminal: `openssl rand -hex 32` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From local `.env.local` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From `.env.local` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From `.env.local` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From `.env.local` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From `.env.local` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From `.env.local` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | From `.env.local` |
| `OPENAI_API_KEY` | OpenAI API key (Assistant agents) |
| `OPENAI_MODEL` | Optional; defaults to `gpt-4o-mini` |

### 3. Redeploy
**Deployments → … on latest → Redeploy**  
(or push to `main`). Build must run `prisma migrate deploy` successfully.

### 4. Test
Open the site → Sign up / Sign in → should enter `/app`.
