# Database Setup: Neon PostgreSQL

This backend is configured to run on Neon through one environment variable:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB_NAME?sslmode=verify-full&channel_binding=require
```

## Local Development

1. Create or update `backend/.env.local`.
2. Set `DATABASE_URL` to the Neon connection string from the Neon dashboard.
3. Start the backend:

```bash
npm start
```

The startup logs should show:

```text
DATABASE: PostgreSQL via DATABASE_URL
Provider: Neon
Host: <your-neon-host>.neon.tech
SSL: enabled
```

## Environment Variables

```env
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB_NAME?sslmode=verify-full&channel_binding=require
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SYNC_ALTER=false
JWT_SECRET=change_this_secret
NODE_ENV=development
```

`backend/src/server.js` loads `.env` first and then `.env.local` with override enabled, so values in `.env.local` win during local development.

By default, startup runs `sequelize.sync()` without `alter`. That creates missing tables but avoids risky enum/table rewrites on an existing Neon database. Set `DB_SYNC_ALTER=true` only when you intentionally want Sequelize to alter the schema.

## Copying Data Between PostgreSQL Databases

The optional copy script is provider-neutral:

```bash
npm run copy-db
```

It reads:

```env
SOURCE_DATABASE_URL=postgresql://source-user:source-password@source-host/source-db?sslmode=verify-full
LOCAL_DATABASE_URL=postgresql://local-user:local-password@localhost:5432/local-db
```

If `SOURCE_DATABASE_URL` is not set, it falls back to `DATABASE_URL`.

## Production

Wherever you deploy the backend, set the deployed service's `DATABASE_URL` to the Neon connection string. Local `.env.local` values are not used by deployed services unless you copy them into that platform's environment settings.

## Troubleshooting

- If logs show a non-Neon host, update the active `DATABASE_URL`.
- If authentication fails, regenerate the Neon connection string and check the database/user/password.
- If SSL fails, keep `sslmode=verify-full`. Only set `DB_SSL_REJECT_UNAUTHORIZED=false` temporarily for diagnosis.
- If the frontend calls the wrong backend, update `frontend/.env.local` and rebuild/restart the frontend.
