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

## Auth flow

Clerk handles auth on both platforms. The Expo app stores tokens in `expo-secure-store`. The Next.js middleware protects all routes except `/api/health` and `/api/inngest`.

To wire Clerk JWTs into Supabase RLS, configure a Supabase JWT template in the Clerk dashboard pointing at your Supabase JWT secret.
