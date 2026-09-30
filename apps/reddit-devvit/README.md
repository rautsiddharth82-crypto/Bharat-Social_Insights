# Reddit Ingest — Devvit App (`bsi-reddit-ingest`)

A [Devvit](https://developers.reddit.com/docs/quickstart) Reddit app that streams
Indian subreddit posts into the **Bharat Social Insights** orchestrator. Instead of
running a `snoowrap`/`praw` poller on your own server (which needs Reddit API
credentials and is subject to aggressive rate limits), this app runs **on Reddit's
infrastructure**, reads the public subreddit "hot" listings on a schedule, and pushes
normalized posts to the orchestrator's `POST /ingest/reddit` webhook.

From the webhook the posts flow into the exact same pipeline as every other platform:
BullMQ `post-ingestion` queue → text cleaning, language detection, bot heuristics,
ML sentiment / topic / stance inference → TimescaleDB hypertable + Neo4j graph writes.

---

## How it works

```
Devvit scheduler (every 15 min)
   → fetch https://www.reddit.com/r/<sub>/hot.json  (HTTP plugin)
   → normalize to @bsi/types Post shape
   → POST <orchestrator>/ingest/reddit
   → ingestionQueue → ML enrichment → DB writes
```

- `src/server/index.ts` — Hono server exposing the scheduled cron endpoint
  (`/internal/cron/ingest-subreddits`) plus a manual `/internal/cron/ingest-now`
  trigger for playtesting.
- `devvit.json` — declares the server entry, the scheduler task, the `settings`
  (orchestrator URL + subreddit list), and `permissions.http` / `permissions.reddit`.

---

## Prerequisites

- Node.js 20+
- The Devvit CLI: `npm install -g devvit` (currently verified against `devvit@0.14.6`)
- A Reddit account, then: `devvit login` (opens browser OAuth — no API keys required)
- A (free) subreddit to use as your playtest home, e.g. created for testing.

---

## Setup

1. **Install dependencies** (this is a standalone app, deployed with the Devvit CLI):
   ```bash
   cd apps/reddit-devvit
   npm install --workspaces=false
   ```

2. **Configure app settings** — either accept the `devvit.json` defaults or edit them in
   the Reddit app dashboard after install:
   - `orchestratorBaseUrl` — the **public HTTPS URL** of your orchestrator
     (Reddit's servers cannot reach `localhost`). For local testing expose it with a
     tunnel such as `ngrok http 8000` and paste the `https://<id>.ngrok.io` value.
   - `subreddits` — comma-separated list of subreddits to ingest.

3. **(Optional) shared secret** — to lock down the webhook, set
   `INGEST_SHARED_SECRET` in the monorepo `.env`, then mirror it into the app's
   settings:
   ```powershell
   devvit settings set bsi-reddit-ingest --name ingestSecret --value "<same value>"
   ```
   The app sends it as the `x-ingest-secret` header; the orchestrator rejects
   requests that don't match.

4. **Run a playtest** (creates the app on your test subreddit):
   ```bash
   devvit playtest <your_test_subreddit>
   ```

5. **Trigger ingest immediately** (without waiting for the 15-min cron) from another
   terminal, or wait for the scheduler:
   ```bash
   # inside the playtest console, or via the app's internal endpoint
   ```

6. **Deploy permanently**:
   ```bash
   devvit upload
   ```

---

## Enable it on the orchestrator side

In the monorepo root `.env`, once the Devvit app is your primary Reddit source:

```dotenv
REDDIT_DISABLE_POLLING=true   # stop the legacy snoowrap poller / demo fallback
INGEST_SHARED_SECRET=         # optional, must match the devvit secret
```

This makes `/system/connectors` report **Reddit → Active (Devvit push stream)** and
prevents demo samples from mixing into the live feed.

---

## Notes & limitations

- Devvit server bundles must compile to **CommonJS** (handled by the `esbuild`
  `build:server` script → `dist/server/index.js`).
- Reddit's public `.json` listings are read here via the Devvit HTTP plugin; if you
  later obtain Reddit API credentials you can switch `fetchSubredditHot` to
  `oauth.reddit.com` and add an auth header, or use `reddit.getSubredditByName()`
  from `@devvit/web/server` for scoped access.
- The subreddit list should be a set of communities you're authorized to read data
  from, in line with Reddit's data / developer terms.
