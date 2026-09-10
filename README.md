# Milky

An emotionally intelligent real-time travel companion.

## Stack

| Layer | Tech |
|---|---|
| Mobile | React Native + Expo (Expo Router) |
| API / Web | Next.js 14 (App Router) on Vercel |
| Auth | Clerk |
| Database | Supabase Postgres + pgvector |
| LLM | Claude API via Vercel AI SDK |
| Background jobs | Inngest |
| Analytics | PostHog |
| LLM observability | Langfuse |

## Monorepo structure

```
milky-ai/
  apps/
    mobile/        Expo React Native app
    web/           Next.js API layer
  packages/
    db/            Supabase client + generated types
    config/        Shared env var validation (zod)
  package.json     npm workspaces root
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
# Next.js API
cp apps/web/.env.local.example apps/web/.env.local

# Expo mobile
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in your Clerk, Supabase, Anthropic, Inngest, Langfuse, and PostHog credentials.

### 3. Run the web API

```bash
npm run dev:web
```

### 4. Run the mobile app

```bash
npm run dev:mobile
```

## Key commands

```bash
npm run dev:web          # Start Next.js dev server
npm run dev:mobile       # Start Expo dev server
npm run build:web        # Build Next.js for production
npm run typecheck        # Type-check all packages
npm run lint             # Lint all packages
```

## Health check

`GET /api/health` — returns `{ status: "ok", db: "ok", timestamp }` and confirms Supabase connectivity. No auth required.

## Database types

After connecting your Supabase project:

```bash
npx supabase gen types typescript \
  --project-id <your-project-id> \
  > packages/db/src/database.types.ts
```

## Keeping Supabase awake

Supabase pauses free-tier projects after **7 days of inactivity**, and the pause
timer only resets on traffic through the **Data API** (the PostgREST `/rest/v1`
endpoint) — direct SQL or dashboard queries don't count. The workflow at
`.github/workflows/supabase-keepalive.yml` sends one read-only REST request every
2 days to keep the project alive.

### Setup

In your GitHub repo, go to **Settings → Secrets and variables → Actions** and add:

| Name | Type | Value | Where to find it |
|---|---|---|---|
| `SUPABASE_PROJECT_REF` | Secret | Your project ref (e.g. `abcdefghijklmno`) | Supabase dashboard → **Project Settings → General → Reference ID**. It's also the subdomain in your project URL: `https://<ref>.supabase.co`. |
| `SUPABASE_ANON_KEY` | Secret | The `anon` / public API key | Supabase dashboard → **Project Settings → API → Project API keys → `anon` `public`**. |
| `TABLE` | Variable | Any table the anon key can `SELECT` from | Pick a small existing table (must be readable under your RLS policies). |

The request is read-only (`GET ...?select=id&limit=1`) and safe to run repeatedly.
Trigger it manually any time from the **Actions** tab → **Supabase keep-alive** →
**Run workflow**. The job fails (with the HTTP status and response body in the log)
if the endpoint returns a non-2xx status.

> **Caveat — GitHub disables idle cron workflows.** GitHub automatically disables
> scheduled workflows after **60 days without any repo activity** (commits, etc.) —
> exactly the dormancy a paused side project falls into. If that happens, the
> keep-alive stops running silently. **Mitigation:** point a free external uptime
> monitor (e.g. UptimeRobot, cron-job.org) at the same REST URL on a similar
> cadence, so keep-alive traffic doesn't depend on GitHub's scheduler. (A periodic
> trivial commit also resets the 60-day timer, but an external ping is more
> reliable.)

## Auth flow

Clerk handles auth on both platforms. The Expo app stores tokens in `expo-secure-store`. The Next.js middleware protects all routes except `/api/health` and `/api/inngest`.

To wire Clerk JWTs into Supabase RLS, configure a Supabase JWT template in the Clerk dashboard pointing at your Supabase JWT secret.
