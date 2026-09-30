import { FastifyInstance } from "fastify";
import { PostSchema, Post } from "@bsi/types";
import { ingestionQueue } from "../../queue/ingestionQueue.js";
import { statusTracker } from "../../collectors/statusTracker.js";
import { config } from "../../config.js";

/**
 * Ingest webhook for the Reddit Devvit app (apps/reddit-devvit).
 *
 * The Devvit server app runs on Reddit's infrastructure, periodically reads
 * subreddit "hot" listings and POSTs normalized posts here. Each post is
 * validated against the shared @bsi/types Post schema (missing analysis fields
 * fall back to schema defaults; the BullMQ ingestion worker recomputes
 * sentiment / topic / stance / demographics via the ML service) and then pushed
 * onto the same post-ingestion queue used by the polling collectors.
 */
export async function ingestRoutes(fastify: FastifyInstance) {
  fastify.post("/reddit", async (req, reply) => {
    // Optional shared-secret protection for external callers.
    if (config.ingestSharedSecret) {
      const provided = req.headers["x-ingest-secret"];
      if (provided !== config.ingestSharedSecret) {
        return reply.status(401).send({ error: "invalid ingest secret" });
      }
    }

    const body = req.body as { posts?: unknown[] };
    if (!body || !Array.isArray(body.posts)) {
      return reply.status(400).send({ error: "expected body.posts to be an array" });
    }

    let queued = 0;
    const rejected: number[] = [];

    for (let i = 0; i < body.posts.length; i++) {
      const parsed = PostSchema.safeParse(body.posts[i]);
      if (!parsed.success) {
        rejected.push(i);
        continue;
      }
      const post: Post = parsed.data;
      try {
        await ingestionQueue.add("ingest", post);
        queued++;
      } catch (qErr) {
        fastify.log.error(`Reddit ingest queue add failed: ${(qErr as Error).message}`);
        rejected.push(i);
      }
    }

    if (queued > 0) {
      await statusTracker.updateStatus(
        "reddit",
        true,
        `Active (Devvit push) - ${queued} posts queued`,
        false
      );
    }

    return {
      ok: true,
      received: body.posts.length,
      queued,
      rejected,
    };
  });
}
