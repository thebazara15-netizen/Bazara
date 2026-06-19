# Database Setup: Local Development + Render Deployment

This guide explains how to configure your database for both local development and Render production deployment.

## Quick Overview

- **Local Development**: Uses SQLite by default (no setup needed) OR local Postgres
- **Render Production**: Uses Postgres DATABASE_URL (provided by Render)
- **No code changes needed** — configuration is automatic via environment variables

---

## Option 1: Local Development with SQLite (Recommended for Quick Start)

### What happens automatically:
- When you run the backend locally without any database environment variables, it falls back to **SQLite**
- Database file is created at: `backend/data/dev.sqlite`
- Perfect for testing and development — no Postgres setup required

### How to get started:

```bash
cd backend
npm install
npm start
```

The server will start with SQLite. Check the logs:
```
✓ No Postgres config found. Falling back to SQLite at /path/to/data/dev.sqlite.
✓ Server running on http://localhost:5000
```

---

## Option 2: Local Development with Postgres

### Prerequisites:
1. **Install Postgres** locally:
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql`

2. **Start Postgres service** and verify it's running:
   ```bash
   psql --version
   ```

### Setup steps:

1. **Create a local database:**
   ```bash
   # Open Postgres terminal
   psql -U postgres
   
   # Inside psql:
   CREATE DATABASE myapp_db;
   \q
   ```

2. **Copy `.env.local` template:**
   ```bash
   cd backend
   cp .env.example .env.local
   ```

3. **Edit `.env.local` and uncomment Postgres settings:**
   ```env
   DB_NAME=myapp_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_SSL=false
   DB_USE_DATABASE_URL=false
   DATABASE_URL=
   ```

   If you prefer to use a single connection string locally, set:
   ```env
   DB_USE_DATABASE_URL=true
   DATABASE_URL=postgres://postgres:your_postgres_password@localhost:5432/myapp_db
   ```
   If your password contains special characters like `#`, `@`, or `/`, encode them first.
   Example:
   ```env
   DATABASE_URL=postgres://postgres:your%23password@localhost:5432/myapp_db
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

You should see:
```
✓ Connected to Postgres at localhost:5432/myapp_db
✓ Server running on http://localhost:5000
```

---

## Option 3: Neon Production Deployment

### Step 1: Create a Neon database

1. Go to https://neon.tech and sign in or sign up.
2. Create a new project and database.
3. Choose a database name such as `myapp_db`.
4. Find the connection details in the Neon console.
   - Use the **External connection string** or **Postgres connection string**.
   - Neon will provide a URL like:
     `postgres://<user>:<password>@<host>:5432/<database>?sslmode=require`

### Step 2: Configure the backend to use Neon

1. In `backend/.env.local` set:
   ```env
   DB_USE_DATABASE_URL=true
   DATABASE_URL=postgres://<user>:<password>@<host>:5432/<database>?sslmode=require
   ```

2. If you prefer explicit values instead of `DATABASE_URL`, set:
   ```env
   DB_NAME=<database>
   DB_USER=<user>
   DB_PASSWORD=<password>
   DB_HOST=<host>
   DB_PORT=5432
   DB_SSL=true
   DB_USE_DATABASE_URL=false
   ```

3. Start the backend from `backend/`:
   ```bash
   npm start
   ```

4. Confirm the backend logs show a Neon connection and no SQLite fallback.

> Note: When running locally with a `DATABASE_URL`, keep `DB_USE_DATABASE_URL=true` because the repo may also have local `DB_HOST` values set.

---

## Option 4: Render Production Deployment

### Step 1: Create Postgres Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **PostgreSQL**
3. Fill in:
   - **Name**: `b2b-marketplace-db` (or your choice)
   - **Database**: `myapp_db`
   - **User**: `postgres` (default)
   - Leave other settings as default
4. Click **Create Database**
5. Wait for provisioning (~1-2 minutes)
6. Copy the **External Database URL** (looks like: `postgres://user:pass@host:5432/dbname`)

### Step 2: Configure Backend Service on Render

1. Go to your **Backend Service** on Render
2. Click **Environment** (left sidebar)
3. Add the following environment variable:
   ```
   DATABASE_URL = postgres://user:pass@your-render-host:5432/myapp_db
   ```
   (Paste the URL from Step 1)

4. Add other required variables:
   ```
   NODE_ENV = production
   JWT_SECRET = your_super_secret_key_here
   FRONTEND_URL = https://your-frontend-url.onrender.com
   RAZORPAY_KEY_ID = your_key
   RAZORPAY_KEY_SECRET = your_secret
   ```

5. Click **Save**
6. Your backend will automatically redeploy with the new variables

### Step 3: Run Database Migrations (if needed)

After deploying, if you need to populate initial data:

```bash
# Locally, connect to Render database and run seeds:
DATABASE_URL="postgres://..." npm run seed
```

---

## Copy Render Database Data to Local

If you want your local database to contain the same data as Render, use the new data copy script.

### 1. Configure local and remote DB URLs

In `backend/.env.local`, add or update:

```env
REMOTE_DATABASE_URL=postgres://user:pass@your-render-host:5432/myapp_db
LOCAL_DATABASE_URL=postgres://postgres:your_local_password@localhost:5432/myapp_db
```

If your local DB is already defined with `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT`, you only need `REMOTE_DATABASE_URL`.

If you want to keep local Postgres config in separate `DB_*` values, leave `LOCAL_DATABASE_URL` commented out and keep `REMOTE_DATABASE_URL` set.

> Note: The sync script now accepts both `postgres://` and `postgresql://` render URLs and will use SSL automatically for Render-hosted Postgres.

### 2. Run the sync command

From the backend folder:

```bash
cd backend
npm run sync-db
```

You can also run `npm run copy-db` if you prefer the original alias.

### What this does

- connects to your Render database using `REMOTE_DATABASE_URL`
- connects to your local Postgres database using `LOCAL_DATABASE_URL` or local `DB_*` settings
- truncates local tables
- copies all rows from Render into local

### Requirements

- Local database must be PostgreSQL
- `REMOTE_DATABASE_URL` must point to the Render DB
- `LOCAL_DATABASE_URL` or `DB_*` must point to your local Postgres DB

---

## How Database Selection Works

The backend automatically picks the right database based on environment variables:

```
✓ If DATABASE_URL is set
  └─> Use Postgres with that URL (Render scenario)

✓ Else if DB_NAME, DB_USER, DB_HOST are all set
  └─> Use local/custom Postgres (Option 2)

✓ Else
  └─> Fall back to SQLite (Option 1)
```

This means:
- **Locally**: Edit `.env.local` → database config changes
- **Render**: Set environment variables in Render dashboard → automatic Postgres connection
- **No code changes needed** between local and production!

---

## Testing Your Setup

### Test Local Database Connection:

```bash
cd backend
node -e "const db = require('./src/config/database'); db.authenticate().then(() => console.log('DB OK')).catch(e => console.error('DB ERROR:', e.message))"
```

Expected output:
```
DB OK
```

### Test Render Connection:

In Render logs, you should see:
```
Connected to Postgres at render-db-host:5432/myapp_db
```

---

## Environment Variables Reference

| Variable | Local | Render | Purpose |
|----------|-------|--------|---------|
| `DATABASE_URL` | (empty) | `postgres://...` | Production DB connection string |
| `DB_NAME` | `myapp_db` | (empty) | Database name (ignored if DATABASE_URL set) |
| `DB_USER` | `postgres` | (empty) | DB user (ignored if DATABASE_URL set) |
| `DB_PASSWORD` | `password` | (empty) | DB password (ignored if DATABASE_URL set) |
| `DB_HOST` | `localhost` | (empty) | DB host (ignored if DATABASE_URL set) |
| `NODE_ENV` | `development` | `production` | Environment mode |
| `JWT_SECRET` | `dev_secret` | `your_secret` | JWT signing key |
| `FRONTEND_URL` | `http://localhost:3000` | `https://...onrender.com` | Frontend URL for CORS |

---

## Troubleshooting

### Issue: "Database config missing"
**Solution**: Make sure `.env.local` exists in `backend/` directory with valid database settings, OR leave it empty to use SQLite fallback.

### Issue: "Cannot connect to Postgres at localhost:5432"
**Solution**: 
1. Check Postgres is running: `psql --version`
2. Verify `.env.local` has correct credentials
3. Try SQLite instead (no setup needed)

### Issue: Render deployment fails with "Exited with status 1"
**Solution**:
1. Check Render logs: Environment → Logs
2. Verify `DATABASE_URL` environment variable is set on Render
3. Ensure the Postgres database on Render is fully provisioned

### Issue: Data lost after Render redeploy
**Note**: Render's Postgres database **persists** across redeployments. If data is lost:
1. Check if you accidentally deleted the Render database
2. Verify environment variables weren't accidentally cleared
3. Check the `.next/logs/next-development.log` for errors

---

## Summary Checklist

### For Local Development:
- [ ] Clone repo: `git clone ...`
- [ ] Install backend: `cd backend && npm install`
- [ ] Copy env: `cp .env.example .env.local`
- [ ] (Optional) Edit `.env.local` for Postgres OR leave empty for SQLite
- [ ] Run: `npm start`

### For Render Deployment:
- [ ] Create Postgres database on Render
- [ ] Copy DATABASE_URL from Render
- [ ] Set `DATABASE_URL` env var in Backend Service
- [ ] Set other required vars (JWT_SECRET, etc.)
- [ ] Push to GitHub
- [ ] Render auto-deploys and connects to Postgres

---

## Next Steps

- For seeding initial products, see: `backend/seed-products.js`
- For API documentation, see: `SOCIAL_LOGIN_SETUP.md`
- For troubleshooting Render, see: Render Dashboard → Logs
