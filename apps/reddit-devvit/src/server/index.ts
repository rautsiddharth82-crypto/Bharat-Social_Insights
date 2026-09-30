import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getServerPort, reddit, settings } from "@devvit/web/server";

/**
 * Bharat Social Insights — Reddit ingest worker (Devvit server app).
 *
 * Runs on Reddit's infrastructure via the Devvit Web runtime. A scheduled task
 * wakes up every 15 minutes, pulls the current "hot" listings from the
 * configured Indian subreddits (Reddit public JSON, reached through Devvit's
 * HTTP plugin), normalizes them, and forwards a batch to the orchestrator's
 * `/ingest/reddit` webhook.
 *
 * From the webhook the posts flow through the same BullMQ `post-ingestion`
 * pipeline used by every other collector: cleaning → language detect → ML
 * sentiment / topic / stance inference → TimescaleDB + Neo4j writes.
 */

// Matches the subset of the @bsi/types Post shape the ingestion worker needs.
// The worker recomputes sentiment, topic, stance, demographics on its own.
interface NormalizedPost {
  platform: "reddit";
  post_id: string;
  author_id: string;
  text: string;
  timestamp: string;
  likes: number;
  shares: number;
  comments_count: number;
  language: string;
  raw_bio: string;
  is_demo_sample: boolean;
}

interface RedditListingChild {
  data: {
    id: string;
    title?: string;
    selftext?: string;
    author?: string;
    created_utc?: number;
    score?: number;
    num_comments?: number;
    subreddit?: string;
  };
}

const DEFAULT_SUBREDDITS =
  "india,mumbai,delhi,bangalore,IndianStudents,JEENEETards,unitedstatesofindia,IndianStreetBets";

function detectLanguage(text: string): string {
  const devanagari = /[\u0900-\u097F]/.test(text);
  const latin = /[a-zA-Z]/.test(text);
  if (devanagari && latin) return "hinglish";
  if (devanagari) return "hi";
  return "en";
}

async function fetchSubredditHot(sub: string): Promise<NormalizedPost[]> {
  const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=25&raw_json=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "bsi-reddit-devvit/1.0 (Bharat Social Insights)" },
  });
  if (!res.ok) {
    console.warn(`Reddit r/${sub} listing failed: HTTP ${res.status}`);
    return [];
  }
  const json = (await res.json()) as { data?: { children?: RedditListingChild[] } };
  const children = json.data?.children ?? [];

  return children.map((child) => {
    const d = child.data;
    const text = `${d.title ?? ""}\n${d.selftext ?? ""}`.trim();
    const ts = d.created_utc ? new Date(d.created_utc * 1000).toISOString() : new Date().toISOString();
    return {
      platform: "reddit" as const,
      post_id: `rd_${d.id}`,
      author_id: d.author || "reddit_user",
      text,
      timestamp: ts,
      likes: d.score ?? 0,
      shares: 0,
      comments_count: d.num_comments ?? 0,
      language: detectLanguage(text),
      raw_bio: `Reddit: r/${d.subreddit ?? sub}`,
      is_demo_sample: false,
    };
  });
}

async function runIngest(): Promise<{ fetched: number; posted: number }> {
  // `settings` is Devvit's server-scoped settings client. Values come from the
  // app's global settings configured in devvit.json and the Reddit app dashboard.
  const baseUrl = (((await settings.get("orchestratorBaseUrl")) as string | undefined) ?? "http://localhost:8000").replace(/\/+$/, "");
  const subListRaw = ((await settings.get("subreddits")) as string | undefined) ?? DEFAULT_SUBREDDITS;
  const ingestSecret = (await settings.get("ingestSecret")) as string | undefined;

  const subs = subListRaw.split(",").map((s: string) => s.trim()).filter(Boolean);

  let fetched = 0;
  const posts: NormalizedPost[] = [];

  for (const sub of subs) {
    try {
      const batch = await fetchSubredditHot(sub);
      posts.push(...batch);
      fetched += batch.length;
    } catch (err) {
      console.warn(`r/${sub} ingest error:`, (err as Error).message);
    }
  }

  if (posts.length === 0) {
    return { fetched: 0, posted: 0 };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (ingestSecret) headers["x-ingest-secret"] = ingestSecret;

  try {
    const res = await fetch(`${baseUrl}/ingest/reddit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ posts }),
    });
    if (!res.ok) {
      console.error(`Orchestrator ingest webhook responded ${res.status}: ${await res.text()}`);
      return { fetched, posted: 0 };
    }
    const body = (await res.json()) as { queued?: number };
    return { fetched, posted: body.queued ?? posts.length };
  } catch (err) {
    console.error("Failed to reach orchestrator ingest webhook:", (err as Error).message);
    return { fetched, posted: 0 };
  }
}

// Referenced so `reddit` stays imported for downstream use (e.g. switching to
// reddit.getSubredditByName() when the app needs moderator-scoped data).
void reddit;

export const app = new Hono();

// Scheduler task endpoint (see devvit.json -> scheduler.tasks["ingest-subreddits"]).
app.post("/internal/cron/ingest-subreddits", async (c) => {
  const result = await runIngest();
  console.log(`[reddit-devvit] fetched=${result.fetched} posted=${result.posted}`);
  return c.json({ ok: true, ...result });
});

// Manual trigger for playtesting without waiting for the cron schedule.
app.post("/internal/cron/ingest-now", async (c) => {
  const result = await runIngest();
  return c.json({ ok: true, ...result });
});

app.get("/health", (c) => c.json({ ok: true, service: "bsi-reddit-devvit" }));

// Devvit's Webbit server bootstrap. The runtime expects a Node HTTP server
// listening on the port provided by getServerPort(); Hono's fetch is bridged
// through @hono/node-server.
serve({ fetch: app.fetch, port: getServerPort() });

export default app;
