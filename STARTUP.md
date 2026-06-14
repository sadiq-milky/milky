# Daily Startup — Milky AI

After a machine reboot, all running processes (dev server, ngrok, Claude Code) are killed. All code and files on disk are safe. The only thing that needs reconfiguring is the ngrok URL, which changes on every restart (free tier).

---

## Steps

**1. Start the dev server**

```bash
cd ~/Projects/milky-ai && npm run dev:web
```

Confirm it starts on **port 3000**. If you see port 3001, something else is occupying 3000 — kill it (`lsof -ti:3000 | xargs kill`) and restart.

---

**2. (Only if testing new user signups today) Start ngrok**

In a new terminal:

```bash
ngrok http 3000
```

This gives a new `https://xxxx.ngrok-free.dev` URL every time. Copy it.

---

**3. (Only if you ran step 2) Update the webhook URL in Clerk**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Configure → Webhooks**
2. Edit your endpoint
3. Replace the URL with `https://<new-ngrok-url>/api/webhooks/clerk`
4. Save

The **signing secret** in `apps/web/.env.local` (`CLERK_WEBHOOK_SECRET=whsec_...`) does not change — leave it alone.

---

**4. (Optional) Start Claude Code**

```bash
cd ~/Projects/milky-ai && claude
```

---

## Important notes

- **Steps 2–3 are only needed when testing new user signups.** For normal chat or feature work with your already-provisioned user, skip ngrok entirely — the dev server alone is enough.

- **An idle dev server, ngrok, or browser tab costs nothing.** Anthropic API tokens are only spent when a message is actually sent in the chat UI.

- **TODO / future fix:** The rotating ngrok URL is a free-tier annoyance. A stable URL — either ngrok's paid tier or a Vercel preview deploy — would eliminate the daily Clerk webhook update step entirely.

---

## Open questions / tech debt

- **Vercel AI Gateway vs direct Anthropic:** The app currently calls Anthropic directly via `@ai-sdk/anthropic` because the gateway returned 403 (requires a credit card on file) during development. Before going to production, revisit whether the gateway is worth enabling — it provides request logging, spend tracking, caching, and fallback routing. Confirm whether those benefits matter for the production architecture before committing to the direct-call approach.
