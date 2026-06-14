# Daily Startup — Milky AI

After a machine reboot, all running processes (API server, Expo, ngrok, Claude Code) are killed. All code and files on disk are safe. The only thing that needs reconfiguring is the ngrok URL, which changes on every restart (free tier).

**Architecture:** `apps/api` is the backend (Next.js API-only). `apps/mobile` is the product (Expo / React Native, tested on a physical phone via Expo Go). There is no web app — it was removed once the backend was extracted.

---

## Steps

**1. Start the API backend**

```bash
cd ~/Projects/milky-ai/apps/api && npm run dev
```

Confirm it starts on **port 3000**. If you see port 3001, something else is occupying 3000 — kill it (`lsof -ti:3000 | xargs kill`) and restart. The mobile app expects the backend on port 3000.

---

**2. Start the mobile app**

In a new terminal:

```bash
cd ~/Projects/milky-ai/apps/mobile && npx expo start
```

Scan the QR code with Expo Go on your phone. Phone and Mac must be on the **same WiFi** — the app reaches the backend via your Mac's LAN IP (`EXPO_PUBLIC_API_URL` in `apps/mobile/.env`, currently `http://10.0.0.61:3000`).

> If your Mac's LAN IP changes (new network, DHCP lease), update `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` and restart Expo with `npx expo start --clear`. Find the IP with `ipconfig getifaddr en0`.

---

**3. (Only if testing NEW user signups today) Start ngrok + update Clerk webhook**

New-user provisioning needs Clerk to reach the backend's webhook. Day-to-day chat with your existing account does **not** need this — skip to using the app.

```bash
ngrok http 3000
```

This gives a new `https://xxxx.ngrok-free.dev` URL every time. Then:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Configure → Webhooks**
2. Edit your endpoint
3. Replace the URL with `https://<new-ngrok-url>/api/webhooks/clerk`
4. Save

The **signing secret** in `apps/api/.env.local` (`CLERK_WEBHOOK_SECRET=whsec_...`) does not change — leave it alone.

---

**4. (Optional) Start Claude Code**

```bash
cd ~/Projects/milky-ai && claude
```

---

## Important notes

- **Step 3 (ngrok + Clerk webhook) is only needed when testing new user signups.** For normal chat or feature work with your already-provisioned account, skip ngrok entirely — the API server + Expo are enough.

- **An idle API server, Expo, or ngrok costs nothing.** Anthropic API tokens are only spent when a message is actually sent from the app.

- **TODO / future fix:** The rotating ngrok URL is a free-tier annoyance. A stable URL — ngrok's paid tier or a deployed backend — would eliminate the daily Clerk webhook update step entirely.

---

## Open questions / tech debt

- **Vercel AI Gateway vs direct Anthropic:** The app calls Anthropic directly via `@ai-sdk/anthropic` because the gateway returned 403 (requires a credit card on file) during development. Before production, revisit whether the gateway is worth enabling — it provides request logging, spend tracking, caching, and fallback routing. A `TODO` comment marks the model call site in `apps/api/app/api/chat/route.ts`.

- **Mobile streaming:** Expo Go can't read streaming HTTP response bodies (`response.body` is null), so `/api/chat` returns the full reply as JSON to mobile clients (via the `X-Milky-Client: mobile` header). Real word-by-word streaming on mobile requires a custom Expo dev build — deferred until it's worth the setup.
