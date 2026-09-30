# Deploying Bharat Social Insights — Vercel (frontend) + Render (backend)

This guide matches the actual code in this repo. It is written for the
"PS/NTRO prototype that has to run live in production" case: every service is
independently deployable, and if a backing service is missing the UI still
renders the last stored snapshot — the interface carries no "demo" branding, so
the only provenance markers left are operational ones (`LIVE` vs `CACHE`, and the
`is_demo_sample` / `source` fields that stay in the API payloads and the database
for audit).

---

## 1. What goes where

| Piece | Repo path | Deploy to | Why |
|---|---|---|---|
| React dashboard | `apps/Client` | **Vercel** | Static Vite build, edge CDN, preview deploys per PR |
| Orchestrator API + ingestion | `apps/orchestrator` | **Render Web Service (Node)** | Long-running polling loop + Fastify API on port from `$PORT` |
| ML inference (FastAPI, PyTorch CPU) | `apps/ml-service` | **Render Web Service (Python)** — or skip | Needs ~1 GB RAM and HF weight downloads; never on the free tier |
| TimescaleDB | `apps/orchestrator/src/db/init_db.sql` | **Timescale Cloud** (or any managed PG ≥ 14) | Hypertables; Render's managed PG does **not** ship the `timescaledb` extension |
| Neo4j Aura | `NEO4J_URI` | **Neo4j AuraDB Free** (already in use) | Influence graph / GDS PageRank |
| Redis | `REDIS_HOST` | **Redis Cloud** or Render Key Value Store | BullMQ broker + live feed cache |

Data flow in production:

```
Vercel (browser)  ──HTTPS──▶  Render orchestrator  ──▶  TimescaleCloud / Neo4j Aura / Redis Cloud
        /alerts                    │        └────────▶  Render ml-service (/sentiment, /topics …)
        /posts/live                └── polls Telegram / YouTube / Reddit / FB / X every cycle
```

The browser only ever talks to the orchestrator. The ML service and the DBs are
private — only the orchestrator reaches them.

---

## 2. Before you push anything

1. **The repo has no git history yet.** Initialise and push to GitHub:

   ```powershell
   cd "e:\Web-Development Coder's Army\Social Media"
   git init
   git add .
   git commit -m "Bharat Social Insights — live UI wiring"
   git branch -M main
   git remote add origin https://github.com/<you>/bharat-social-insights.git
   git push -u origin main
   ```

2. **Never commit secrets.** `.env` files are gitignored; confirm with
   `git status`. All credentials below are entered in the Render/Vercel dashboards.

3. **Whitelist outbound IPs.** Timescale Cloud, Neo4j Aura and Redis Cloud all have
   IP allow-lists. After Render creates the service it shows an **external IP**
   (or "0.0.0.0/0" for a quick demo). Add it, or the DB connection will time out
   and the API will silently drop to `source: "fallback"` sample data.

---

## 3. Render — orchestrator (the backend)

**New ➜ Web Service ➜ connect the GitHub repo.**

Because this is an npm-workspaces monorepo and `@bsi/types` / `@bsi/i18n` are
imported by orchestrator code, keep the **Root Directory at the repository root**
so workspace resolution works.

| Setting | Value |
|---|---|
| Name | `bsi-orchestrator` |
| Environment | Node |
| Region | `Singapore (SG1)` — closest to the user base, lowers latency to Aura/Redis |
| Branch | `main` |
| Root Directory | *(leave blank — repo root)* |
| Build Command | `npm install --legacy-peer-deps && npm run build --workspace=@bsi/types --workspace=@bsi/i18n && npm run build --workspace=apps/orchestrator` |
| Start Command | `node apps/orchestrator/dist/main.js` |
| Health Check Path | `/health` |
| Instance Type | **Starter – 0.5 CPU / 512 MB** ($7) minimum |

> `--legacy-peer-deps` is required: `snoowrap`/`telegram` pull peer versions that
> conflict with the pinned Fastify stack (this is also how it installs locally).

### Environment variables (Render ➜ Environment)

```
ENVIRONMENT=production
NODE_ENV=production

# --- Timescale Cloud ---
POSTGRES_HOST=<your-timescale-service-host>
POSTGRES_PORT=5432
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<password>
POSTGRES_DB=social_analytics
POSTGRES_SSL=true              # REQUIRED — managed PG rejects plain connections

# --- Neo4j Aura ---
NEO4J_URI=neo4j+s://<instance-id>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>

# --- Redis ---
REDIS_HOST=<redis-cloud-host>
REDIS_PORT=<port>
REDIS_USER=<default>
REDIS_PASSWORD=<password>

# --- ML service (private Render URL of step 4) ---
ML_SERVICE_URL=https://bsi-ml-service.onrender.com

# --- Browser access (Vercel) ---
CORS_ORIGIN=https://<your-app>.vercel.app
# Comma-separated lists are supported, e.g. to also allow preview deploys:
# CORS_ORIGIN=https://<your-app>.vercel.app,https://preview-abc123.vercel.app

# --- Connectors: only the ones you actually have credentials for ---
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_SESSION_STRING=
YOUTUBE_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=bharat_social_insights/1.0
INGEST_SHARED_SECRET=<random 32+ chars if you expose /ingest/reddit>
```

`PORT` is injected by Render and read by `src/config.ts`, which binds
`0.0.0.0` — no extra host/port variables needed.

### First deploy check

```powershell
Invoke-WebRequest "https://bsi-orchestrator.onrender.com/health" -UseBasicParsing
Invoke-WebRequest "https://bsi-orchestrator.onrender.com/system/pipeline" -UseBasicParsing
```

`/system/pipeline` is your single-pane diagnosis: it reports `postgres`, `neo4j`,
`redis`, `ml_service`, `queue` and `connectors` as `ok` / `degraded`, plus the
row counts. Open it before debugging anything else — the **Audit Trail** and
**Data Ingestion** sections in the UI render exactly this payload.

---

## 4. Render — ML service (optional but recommended)

Without it, sentiment/topic/stance fall back to the rule-based heuristic and the
UI badges it as degraded — real inference gives the numbers analysts expect.

**New ➜ Web Service ➜ Python**, or point Render at `apps/ml-service/Dockerfile`.

| Setting | Value |
|---|---|
| Name | `bsi-ml-service` |
| Environment | Python 3.11 (**3.11 only** — the pinned torch 2.2.1 wheel has no 3.13/3.14 build) |
| Root Directory | `apps/ml-service` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port 10000` |
| Instance | **Starter 1 GB or Standard** — CPU torch + transformers will OOM on 512 MB |

Then set the orchestrator's `ML_SERVICE_URL` to its internal URL
(`https://bsi-ml-service.onrender.com`) and redeploy.

Cold start note: the first request downloads HuggingFace weights and can take
60–120 s. The orchestrator's ML client allows 30 s per call and degrades safely,
so warm the service once (`curl https://bsi-ml-service.onrender.com/health`)
before demoing.

---

## 5. Vercel — the dashboard

**Add New ➜ Project ➜ import the same GitHub repo.**

`vercel.json` at the repository root already contains the correct settings, so
you mostly just confirm them:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build --workspace=apps/Client",
  "outputDirectory": "apps/Client/dist",
  "installCommand": "npm install --legacy-peer-deps",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | *(repo root — `vercel.json` handles the workspace)* |
| Build Command | from `vercel.json` |
| Output Directory | `apps/Client/dist` |
| Node Version | 20.x (Project ➜ Settings ➜ General ➜ Node.js Version) |

### Environment variables (Production **and** Preview)

```
VITE_API_BASE_URL=https://bsi-orchestrator.onrender.com
```

That one variable is the difference between "live" and "offline sample" in the
UI. Locally the Vite dev server proxies `/api` to `http://localhost:8000`;
in the browser there is no proxy, so `src/services/api.ts` builds requests as
`${VITE_API_BASE_URL}/alerts`, `${VITE_API_BASE_URL}/posts/live`, …

- Enter the URL **without** a trailing slash and **without** `/api`.
- Vite only exposes variables prefixed `VITE_` to the client — renaming it to
  `API_BASE_URL` silently yields `/api` and every panel shows `OFFLINE`.
- Any change here requires a **redeploy** (they are baked into the bundle).

### Deploy and verify

```powershell
npm i -g vercel
vercel                        # first preview
vercel --prod                 # production
```

In the deployed site:

1. The sidebar health box should read `HEALTHY` with a real row count, not 0.
2. **Live Data & Signals** (one sidebar item, two tabs) —
   * *Live signals* tab: type `Mumbai` in the search box; the "shown / matching
     records" counter must change and the cards must filter. This proves the
     `/posts/live?q=` path and the orchestrator's DB connection.
   * The **Connector health** strip above it must show the real status strings
     written by the ingestion workers (`Active (gramjs)`, `Active (Quota:
     5047/10000)`, `Standby (no credentials)`, `Error`…). `CACHE · OFFLINE`
     instead means the API call itself failed.
   * *Sources & connectors* tab: the same status as a table (last poll, items this
     poll, quota left) plus the ingestion architecture per platform.
3. Click **"Trace how this arrived"** on any post card — an inline panel must
   expand *under that card* (no page change) with a Patient Zero card, real
   detection lag and the cross-platform arrival order.
4. Scroll the **Dashboard**: *Audience Demographics* and *System Health & Analyst
   Audit Trail* are sections at the bottom of it — sentiment, demographics and
   provenance are features attached to each post, not pages, and only *Audit
   Trail* is still listed in the sidebar (it scrolls to the section and flashes an
   orange ring). Your own analyst id must appear in the audit log within ~15 s of
   browsing (that proves `x-analyst-id` survived the cross-origin preflight).

---

## 6. Free-tier reality check (read this before demoing)

| Problem | Effect | Fix |
|---|---|---|
| Render free instances sleep after 15 min idle | First click spins for ~50 s; **the ingestion loop stops entirely while asleep** | Use the $7 Starter instance, or keep `/health` warm with an external cron ping every 10 min |
| Vercel free build cache | `dist` from a previous branch persists | Project ➜ Settings ➜ "Clear build cache" when a deploy looks stale |
| HF model weights re-download on every ML restart | Slow warm-up | Attach a Render Disk to `bsi-ml-service` and set `HF_HOME` to it |
| `NEO4J` Aura free DB auto-deletes after ~7 days of no activity | `/network/graph` silently switches to the static sample graph, badged `ranking_source: "static-sample"` | Re-create the instance, then hit `/network/influence` once to re-write `influence_score` |
| Redis `volatile-lru` eviction vs BullMQ `noeviction` requirement | Queue jobs get evicted, ingestion stalls | In Redis Cloud, use a **no-eviction** database for the BullMQ host |
| Telegram `AUTH_KEY_UNREGISTERED` | Telegram connector is dead; only seeded demo rows appear | Regenerate `TELEGRAM_SESSION_STRING` via `npm run --workspace=apps/orchestrator generate:telegram-session`-style helper and redeploy |

---

## 7. Alternative: one Docker service on Render

If you'd rather not manage three Render services, `docker-compose.yml` runs
Postgres + Redis + ML + orchestrator + frontend together on a single container
host. Render does **not** run compose files, so this path needs a small VM
(Fly.io, Railway, a $5 Droplet) with docker compose installed:

```bash
docker compose up -d --build
```

Keep the database in the compose group only for demos — data lives on the VM's
disk and disappears with it. For anything durable, use the split topology in
sections 3–5.

---

## 8. Post-deploy hardening checklist

- [ ] Set `CORS_ORIGIN` to the exact Vercel domain (drop the `*` default) once live.
- [ ] Set `INGEST_SHARED_SECRET` — `/ingest/reddit` is a public POST endpoint and
      must not accept unauthenticated writes in a government-facing demo.
- [ ] Rotate every credential you pasted into a dashboard during setup — and any
      that ever appeared in a terminal log. The YouTube key and the Telegram
      session string are printed by the connectors on every failed request.
- [ ] Never commit `.env`. The API keys it holds are what make the demo "live";
      a leaked YouTube key burns the 10 000-unit daily quota and the whole feed
      silently drops to sample rows.
- [ ] Confirm `POSTGRES_SSL=true` — with it unset the pool falls back to
      `source: "fallback"` and the UI shows sample data instead of failing loudly.
- [ ] Verify `/system/pipeline` reports `overall: "healthy"` from a clean browser
      (no localhost running) before you present.
- [ ] Pin the Vercel production alias (e.g. `bharat-social-insights.vercel.app`)
      so screenshots and links in the report stay valid.
