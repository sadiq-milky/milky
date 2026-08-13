# Mobile chat shell — build handoff

**Date:** 2026-06-23
**Author:** Sadiq + Claude (Opus 4.7)
**Scope:** Refactor of the mobile chat screen in `apps/mobile`, plus a side-trip hardening `apps/api/app/api/chat/route.ts`.
**Status:** Done and committed. Behaviour identical to pre-refactor. 19 commits ahead of `origin/main`, unpushed.

---

## TL;DR

Before today, the mobile chat screen was one 198-line file doing auth, network, state, list rendering, and input handling inline. It's now a slim shell (~113 lines) that owns only state and handlers, and composes two presentational components. The API also gained robust JIT user provisioning so localhost dev no longer needs the Clerk webhook to fire.

No new dependencies. Still on Expo Go. JSON-not-streaming response path unchanged.

---

## What lives where now

### Mobile (`apps/mobile/`)

- `app/(app)/index.tsx` — screen shell. Owns: auth (`useAuth`), the four `useState` hooks (`messages`, `input`, `isLoading`, `conversationId`), `handleSend`, `KeyboardAvoidingView`, header (Milky title + Sign out). Composes `MessageList` and `ChatInput`.
- `lib/api.ts` — `sendChatMessage(messages, conversationId, token) → { text, conversationId }`. The single place where the API URL, headers (`Authorization: Bearer`, `X-Milky-Client: mobile`), and response shape (`X-Conversation-Id` header + JSON body) live. Change here if the API contract shifts.
- `lib/types.ts` — `ChatMessage { id, role, text, blocks?: unknown[] }`. **`blocks` is the door left open for rich content** (cards, buttons, images, structured data). Unused today; not rendered or serialized.
- `components/MessageList.tsx` — owns `ScrollView`, its own `scrollRef`, autoscroll, empty hint, bubble rendering. Reads `isLoading` to show "…" on the last bubble.
- `components/ChatInput.tsx` — input row + send button. Disabled state mirrors `isLoading`.
- `lib/supabase.ts` — pre-existing, untouched by this work.

### API (`apps/api/`)

- `app/api/chat/route.ts` — the chat endpoint. Reads Clerk auth, resolves the Supabase `users` row (SELECT first; on miss, JIT-provisions via Clerk profile fetch + `UPSERT` keyed on `clerk_user_id`), creates or uses a conversation, persists the user message, streams from Claude (Opus 4.8), but returns plain JSON when the `X-Milky-Client: mobile` header is present.

### Docs

- `docs/handoff.md` — pre-existing project handoff.
- `docs/jit-provisioning-review.md` — the `/btw` review of the JIT side-trip. Self-described as safe to delete once findings are decided. Findings applied; left in place untracked.
- `docs/mobile-chat-shell-build-handoff.md` — this file.

---

## Key design decisions (and why)

### 1. Pull the API call into `lib/api.ts`

Every future flow (retry, optimistic UI, alternate transport, attachment uploads, multi-modal payloads) wants one place to change. Inlining the fetch meant even small contract changes touched the screen and risked regressions.

### 2. `ChatMessage` has an `id` and an optional `blocks: unknown[]`

Rich content rendering is coming, but designing the block schema now would be premature — we don't yet know what blocks need to express. `unknown[]` reserves the slot without committing to a shape. `id` makes the slot future-proof for React keys, per-message operations (edit/delete/retry), and stable list ordering once we have a backing store.

**Deliberately NOT changed:** the render loop still uses `i` (array index) as the React key. Switching to `m.id` is a one-line change later when ordering becomes load-bearing.

### 3. `id` generation is `String(prev.length + N)` inside the `setMessages` updater

Simplest no-dependency, no-platform-risk approach. `crypto.randomUUID()` works on modern Expo Go but adds a potential cross-platform footgun. Current scheme has zero collision risk within a session.

**Watch out:** if the list ever gets server-restored, deduped, or reordered, these ids will collide or drift. Switch to UUIDs at that point.

### 4. `MessageList` owns its own `scrollRef`

Scroll behaviour is self-contained — no reason for the screen to know about it. Lets the component evolve (smarter autoscroll, scroll-to-message, etc.) without changing the screen's surface.

### 5. Each component owns its own styles

Keeps each component self-contained. The screen now only carries styles for chrome it actually renders (`container`, `header`, `title`, `signOut`). The 13 style entries that moved didn't need to stay coupled to the screen.

### 6. API uses JIT user provisioning with `UPSERT`

In dev the Clerk webhook can't reach `localhost`, so first-time sign-in had no `users` row, producing a misleading "User not found" 404. JIT (fetch from Clerk if SELECT misses, then UPSERT) means first-message-after-signup just works, no webhook tunnel required.

**Why UPSERT and not plain INSERT:** atomicity. Two concurrent first messages could both INSERT and the second would race-fail on the `clerk_user_id` unique constraint. UPSERT with `onConflict: "clerk_user_id", ignoreDuplicates: false` makes the conflict path a no-op update. Same goes for late-webhook race conditions in prod.

**Why SELECT-first (not unconditional UPSERT):** returning users skip a Clerk API round-trip (~100–250ms) and a Supabase write per message. Big wins on the hot path. The race fix only matters when actually creating a row.

### 7. Three small `console.error` guards on `lookupErr` / `upsertErr` / `msgErr`

During incident handling these were missing, and every 500 produced a generic mobile-side string with no terminal trail. Costs nothing; turns future incidents into 30-second triage instead of code archaeology.

---

## Things to be wary of

### Supabase

- **Free-tier auto-pause (~weekly).** If chat suddenly fails with "Network request failed" on mobile and the API log shows `ENOTFOUND <ref>.supabase.co`, the project is paused. Unpause in the dashboard, ~60s. Recurs weekly unless the project gets daily-ish use or moves to a paid tier.
- **No SQL migrations in the repo.** The schema lives only in the live Supabase project. If it's ever *deleted* (not paused), the schema has to be reverse-engineered from `packages/db/src/database.types.ts`. Fix one day: `supabase db pull`.
- **Cascade-deletes from `users`.** Deleting a `users` row cascades to `conversations` and `messages`. If you do this manually for testing, mobile holds a stale `conversationId` in React state — shake → Reload in Expo Go to clear it before the next chat, otherwise the message insert will fail with an FK violation that looks like a backend bug.

### Clerk in dev

- **Webhook can't reach localhost.** JIT path papers over this. For prod-parity in dev, set up ngrok and point the Clerk dashboard webhook there.
- **"Infinite redirect loop" warning from Clerk in the API log on startup** is usually noise from a stale browser tab, not a real key mismatch. If mobile chat works, ignore it.

### Mobile / Expo Go

- **No streaming on Expo Go.** Mobile sends `X-Milky-Client: mobile` and the API returns plain JSON. Streaming word-by-word needs a custom dev build (eject from Expo Go). Defer until the streaming UX is worth the build complexity.
- **`ScrollView`, not `FlatList`.** Fine for short conversations. Becomes a perf issue around hundreds of messages. Switch when needed.
- **`process.env.EXPO_PUBLIC_*` is inlined at bundle time.** When you add a new file that reads one of these vars, sometimes Metro caches the old transform and bundles `undefined`. Symptom: "Network request failed" with no HTTP status code. Fix: `npx expo start --clear`.

### Code to keep an eye on

- `apps/mobile/app/(app)/index.tsx` `apiMessages` builder — uses index-derived ids (`String(i + 1)`) for the wire payload, separate from the local `ChatMessage.id`. If you ever need stable wire ids (server-side dedupe, idempotency keys), unify these.
- `apps/api/app/api/chat/route.ts` — the `X-Milky-Client: mobile` branch returns JSON. Don't accidentally remove this when refactoring streaming.
- `apps/api/app/api/chat/route.ts` `onFinish` — persists assistant message + token usage. If you change the model or the AI SDK response shape, double-check `usage.inputTokens` / `usage.outputTokens` still exist.

---

## What's deferred / next obvious moves

In rough order of likely value:

1. **Rich content blocks.** `ChatMessage.blocks` is reserved but empty. Design the block discriminated union (e.g. `{ type: "card", ... } | { type: "image", ... } | { type: "buttons", ... }`), update `MessageList` to render each kind, update the API to optionally emit them. The mobile side is structurally ready — bubble loop is the only place that needs to grow.
2. **Switch the React key to `m.id`** in `MessageList.tsx` when message ordering becomes load-bearing (server-restored history, edit/delete, retry).
3. **Real streaming** when the UX value justifies leaving Expo Go.
4. **`supabase db pull`** to capture current schema as versioned migrations under `supabase/migrations/`. Before this becomes a real "we'd lose the schema" risk.
5. **Webhook tunnelling (ngrok) in dev** if/when you want full prod-parity locally.
6. **`FlatList` for the message list** before conversations grow past ~50 messages.
7. **Replace the index-based message id scheme with UUIDs** once messages are restored from server or reordered.
8. **Decide on the three diagnostic `console.error` lines.** Currently in. Keep as dev signal or strip for cleanliness — fine either way.
9. **Push the local commits** (currently 19 ahead of `origin/main`).

---

## Working style that worked

Recorded so the next session doesn't have to relearn it.

- **One step at a time. Stop after each. Verify by running the app** — not just typechecking. Typecheck is a guard against typos, not confirmation of correctness.
- **Plain English explanation before each step.** Including what's explicitly *not* changing.
- **Never `--force`** on anything (git, npm, expo).
- **Don't delete working code until the replacement is proven.**
- **Flag ambiguity before coding.** When a spec contradicts itself, surface both readings, recommend one, ask. Sadiq explicitly endorsed this on the JIT Change 1 spec ("Good catch — that was a genuine contradiction in my prompt, thank you for stopping").
- **Sadiq is a solo founder, self-describes as not a strong dev.** Plain English everywhere. Name files, commands, and what to look for. Don't assume framework familiarity.

---

## Commits

- `2048d2e refactor: extract mobile chat fetch + JIT-provision users in /api/chat` — Step 1 + initial JIT (INSERT version)
- `45653b8 harden: atomic upsert + better diagnostics in /api/chat` — JIT Changes 1 (UPSERT) + 2 (console.warn) + 3 error guards
- `95c1d7c refactor: shared ChatMessage type + split chat screen into MessageList/ChatInput` — Steps 2 + 3

`docs/jit-provisioning-review.md` is left untracked. Per its own footer it's safe to delete; Sadiq opted to leave it.
