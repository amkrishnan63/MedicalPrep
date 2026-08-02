# Deployment note

MedicalPrep uses **local SQLite** (`DATABASE_URL=file:./dev.db`) and Firebase Auth.

Run locally:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Put Firebase keys in `.env.local`.

Serverless hosts without a persistent disk cannot keep a SQLite file. Use local development, or a host that gives you a persistent volume for `dev.db`.
