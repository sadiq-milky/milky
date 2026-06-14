# Milky — Project Handoff & Design Reference (v2)

*Living reference for anyone building Milky. Updated to reflect the mobile-first architecture. Supersedes v1 (which described a web+mobile monorepo that no longer exists).*

**Last updated:** End of the environment-setup session. Foundation is verified clean and working; feature-building begins next.

---

## 1. What Milky Is

Milky is an intelligent travel companion. Its core differentiator — the moat — is **context continuity**: it builds a deep, longitudinal understanding of a traveler's "Travel DNA" across sessions and gets smarter over time. Rather than transactional, one-off recommendations, Milky plans around *who you are*, pushes back when useful, and proactively suggests.

**Business model:** Free base tier + premium subscription. Explicitly **no affiliate or commission incentives** — recommendations are never paid placements. Creator partnerships may serve as a distribution / cold-start lever, not core product.

**Build philosophy:** Build for the founder first. Iterate until it's something he'd never replace. Then find ~100 travelers like him. Prove the personalization thesis before scaling.

**Competitive reality:** Memory/personalization is widely *claimed* in a well-funded space. The real edge is building for a deeply understood, specific traveler archetype and accumulating a per-person data moat generic apps structurally cannot replicate.

---

## 2. Architecture & Tech Stack — MOBILE-FIRST

> **Major change from v1:** The project is now mobile-first. The web frontend (`apps/web`) has been deleted. The backend was extracted into a standalone API-only service (`apps/api`). This was done to end persistent React-version conflicts between web (React 18.3.1) and mobile (React 19) that were making the Expo environment unworkable.

### Monorepo structure (npm workspaces)

| Workspace | Role |
|-----------|------|
| `apps/mobile` | **The product.** Expo / React Native, runs on a physical phone via Expo Go. |
| `apps/api` | **API-only backend.** Next.js (App Router), API routes only, no UI. Holds all secrets. Runs on port 3000. |
| `packages/db` | Shared Supabase client + generated TypeScript types. |
| `packages/config` | Shared Zod env validation. |
| ~~`apps/web`~~ | **Deleted.** Recoverable in git at/before commit `b9ca5eb` if ever needed. |

Workspaces line is now `["apps/mobile", "apps/api", "packages/*"]` — `apps/web` removed was the root fix for the React duplication (Metro was watching the whole tree and finding two React versions).

### Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Mobile client | React Native + Expo (SDK 54), Clerk Expo SDK v3 | Working; tested via Expo Go on physical phone |
| Backend | Next.js App Router, API routes only, port 3000 | Working; `/api/health`, `/api/chat`, `/api/webhooks/clerk` |
| Auth | Clerk (mobile SDK + server SDK), Google SSO | Working end-to-end |
| Database | Supabase Postgres + pgvector | Working |
| LLM | Claude via Vercel AI SDK (`ai`) + **`@ai-sdk/anthropic` direct adapter** | Working (see §7 on the gateway decision) |
| Background jobs | Inngest | Planned; `/api/inngest` middleware slot reserved, package not installed |
| Analytics | PostHog | Planned, not wired |
| LLM observability | Langfuse | Planned, not wired |

### The backend's three routes

- `POST /api/chat` — auth-required. Clerk→UUID lookup, get/create conversation, persist user message, stream Claude reply, persist assistant message + token rollups in `onFinish`.
- `GET /api/health` — public. Pings Supabase, returns status. The cheap end-to-end wiring check.
- `POST /api/webhooks/clerk` — public. Verifies Svix signature, inserts a `users` row on `user.created`.

Backend env vars (all secrets live here, NEVER in the mobile app): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`.

### Hard-won environment constraints (do not relearn these the hard way)

- **Mobile client holds NO secrets.** It calls `apps/api` over the network. This boundary is the whole security point of having a backend.
- **Physical-phone networking:** `localhost` on the phone is the *phone*, not the Mac. Mobile must reach the backend via the Mac's LAN IP or an ngrok URL.
- **React versions:** root is React 19 (Expo/mobile). The old web-vs-mobile React conflict is *gone* now that `apps/web` is removed. Don't reintroduce a second React into the workspace.
- **Never run `npm audit fix --force`** — it previously broke Next.js.
- **`NODE_EXTRA_CA_CERTS`** is required on the dev Mac for Homebrew Node SSL; machine-local, not needed in deployment. Any new dev machine needs it.

---

## 3. Memory Architecture

Tiered memory + explicit facts. Context for each LLM call is assembled from these.

- **Episodic** (`episodic_memories`) — raw logs of what happened. Never synthesized.
- **Semantic** (`semantic_memories`) — embedded summaries (pgvector, 1536-dim via `text-embedding-3-small`, HNSW index), retrieved by similarity. Built async from episodic (planned: Inngest).
- **Profile** (`traveler_profiles`) — structured Travel DNA (see §4). Always loaded.
- **User facts** (`user_facts`) — explicit ground truth ("travels with a dog"). Highest confidence, always injected, never retrieved by similarity. Active/superseded pattern for changed preferences.

**Context assembly = user_facts (always) + traveler_profile (always) + semantic_memories (by similarity).** This is the moat in code; it plugs in at the `streamText` call in the chat route. **Not yet built** — this is upcoming feature work.

Auth detail: Clerk uses string IDs; DB uses internal UUIDs. Routes do a Clerk-ID → UUID lookup against `users`. The Clerk webhook provisions the `users` row on signup so the lookup succeeds.

---

## 4. The Travel DNA Model *(locked — this is the heart of the product)*

### Context axes (the "lens" a profile is keyed to)

A traveler doesn't have one fixed style — it shifts systematically by **context**, defined on known, nameable axes:

- **Composition** — who they travel with (solo / partner / kids / friends / family)
- **Purpose** — why (adventure / family holiday / work, etc.)
- **Duration / distance** — how long, how far

Per-person patterns are *learned within* these fixed axes ("discovery within structure") — Milky discovers how *a specific person* shifts across known axes, rather than inventing un-nameable categories from scratch.

### Seven dispositional dimensions (collected by swiping, tagged to active context)

1. **Stimulation** — unfamiliar/uncertain vs. known/safe *(merges original "adventure" + "novelty" — same underlying trait)*
2. **Pace** — fast vs. slow-immersive
3. **Structure** — spontaneous vs. planned
4. **Social energy** — solitude vs. crowds/energy
5. **Indulgence** — luxury/comfort vs. rough/basic *(the* taste*, separated from budget)*
6. **Mediation** — curated/packaged vs. raw/unmediated *(the moat axis — selects for the target archetype, against the mass market)*
7. **Food** — adventurous/varied vs. familiar/consistent *(kept separate; genuinely diverges from adventure)*

### Two structural facts (asked directly, not swiped)

- **Travel unit** — solo / couple / group / family (can change per trip)
- **Budget ceiling** — the *constraint*, separated from the Indulgence *taste*

### Profile architecture: Core + Contextual

A single averaged baseline mis-describes a multi-mode traveler. Driving example: a traveler who, **solo**, seeks adrenaline / cheap motels / spontaneity; but **with his two kids** is the near-opposite — yet enjoys **novelty and food in both modes**.

- **Core DNA** — dimensions stable across a person's contexts (for him: novelty, food).
- **Contextual DNA** — dimensions that flip by context (for him: stimulation, indulgence, structure, pace).
- **Which is which is learned per person** — for another traveler, food might flip and pace stay constant.

### Baseline learning (feedback model)

- **Explicit statements** (highest trust) → move profile immediately/strongly; logged as user facts.
- **Repeated patterns across trips** (medium trust) → Milky *surfaces* and asks, then **nudges** baseline partway on confirmation. Confirmation-gated, never silent.
- **Single-trip behavior** (lowest trust) → moves only the **trip lens**, never the baseline directly. Prevents one work trip from wrecking the profile.
- Recency-weighted. Because contextual profiles store separately, an unusual solo trip can't distort the family profile.

### Archetypes are dynamic, not fixed

Archetype names (e.g. "Feral Sophisticate") are *generated from where a traveler lands in score-space*, not boxes they're sorted into. Requires independent-enough dimensions + a naming layer that turns a score vector into an evocative label.

---

## 5. Onboarding & UX Flow (target design)

**Trip-first sequencing** (driven by real tester behavior — every tester started with their trip, not themselves): **capture trip context first → swipe (tagged to that context) → archetype reveal for that context → planning.** Elegantly solves multi-mode onboarding: first profile is one context; richness accumulates across trips. Delivers value immediately instead of front-loading a survey.

User journey (flow order):

1. **Login / arrival moment** — stunning, animated "you're already traveling" experience (not a static image). Personalized with the user's name (from SSO).
2. **Trip context capture** — where, who with, why, when. Catchy/fun framing. Establishes context before any swipe.
3. **Swipe mechanic + live profile build** — Tinder-style (left=no, right=yes, up=neutral), ~8 cards, adaptive (each card influences the next), shuffled start so users don't all see the same deck. Profile builds live as they swipe. Dimensions tagged to the trip context.
4. **Archetype reveal** — reveal what Milky understood (dynamic archetype for that context); chance to chat-adjust.
5. **Always-on chat window** — persistent sleek shell. Top half = rich responses (cards, maps, animations, games — not just text); bottom half = input that expands/shrinks. Voice (speak/type/mix) planned. Loosely modeled on the Claude interface.

**Recommended BUILD order (differs from flow order):** mobile chat shell (#5, backend already proven) → trip-context capture (#2) → swipe + live profile (#3, highest technical risk: native gestures) → archetype reveal (#4) → login arrival moment (#1, the finishing flourish). Build the understood + the risky early; save pure-visual polish for last.

**Rich responses:** a "Response Type" system was designed — Claude returns structured JSON with a `type` field driving a renderer component for rich blocks (destination cards, route maps, quizzes, weather, video). A `rich_block` JSONB column supports this on the messages table.

---

## 6. Current State — VERIFIED WORKING

Confirmed end-to-end, tested twice from a physical phone:
**Authenticated mobile client → backend over WiFi → Claude → Supabase persistence (actual rows confirmed).** Plus Google SSO sign-in. All four workspaces typecheck clean.

Key commits from the setup session: `b9ca5eb` (extract backend to apps/api), `f9d480d` (mobile chat end-to-end + Google SSO + JSON fallback), `7778c2e` (delete apps/web + update STARTUP.md).

**What exists:** working auth, working chat round-trip (mobile→api→Claude→DB), DB schema with pgvector, Clerk webhook for user provisioning.
**What does NOT exist yet (the actual product):** the Travel DNA model in code, the onboarding/swipe flow, the context-assembly memory pipeline, any of the real UI screens. Everything to date is foundation.

---

## 7. Open Questions / Tech Debt

- **AI Gateway → direct Anthropic is now LOCKED IN.** The chat originally routed through Vercel AI Gateway (for failover + spend tracking) but switched to the direct `@ai-sdk/anthropic` adapter during debugging. The `AI_GATEWAY_API_KEY` was removed during backend extraction. A `// TODO` comment near the model call records the abandoned tradeoff. *Revisit before scale* if provider failover or spend monitoring become important.
- **Mobile streaming is currently full-reply JSON, not word-by-word.** True token streaming on a physical device needs a custom Expo dev build (more setup). Deferred deliberately. *Worth folding in next time Expo build-config work happens anyway* — the live feel matters for a conversational travel companion.
- **Clerk webhook URL points at a stale ngrok URL.** Repoint to an `apps/api` ngrok URL whenever next testing *new-user signup*. Existing-account chat doesn't need it. Symptom if forgotten: a brand-new user can't chat (no `users` row → UUID lookup fails).
- **ngrok free-tier URL rotates** on every restart, needing a Clerk dashboard update each session. A stable URL (ngrok paid or a deployed preview) removes this friction.
- Inngest / PostHog / Langfuse planned but not wired.
- `packages/config` exists but `apps/api` validates env locally rather than through it — minor; consolidate eventually.

---

## 8. Development Workflow Notes

- **Two tools, two jobs.** Claude Code (runs on the machine, sees the filesystem) for *execution* — file edits, commands, chasing errors. The chat interface for *thinking* — architecture, design, understanding the "why." Failure mode: doing execution in chat makes the human a slow copy-paste bridge.
- **Inspect before trusting.** Handoff docs and prior-session summaries drift. When unsure of environment state, run diagnostics that report ground truth. This caught a latent React-duplication bug a summary had declared "solid."
- **Verify by running, not by looking.** A fix isn't confirmed when the config looks right — only when the thing actually runs (page loads / health green / round-trip works on the device).
- **Don't delete the fallback until the replacement is proven.** `apps/web` was kept on disk until the new `apps/api` + mobile chat were verified, then deleted.
- **One clean step at a time.** Complete one step (with the *why*) before the next; don't batch. Preferred working style.
- **Tokens:** an idle browser/server/tunnel consumes zero LLM API tokens — tokens are spent per message sent, not per time open.
