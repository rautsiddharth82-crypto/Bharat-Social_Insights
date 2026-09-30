import { ConnectorStatus } from "@bsi/types";
import { pgPool } from "../db/timescale.js";

export class StatusTracker {
  private cache: Map<string, ConnectorStatus> = new Map();

  async updateStatus(platform: string, configured: boolean, status: string, isDemo: boolean, errorMessage?: string) {
    const item: ConnectorStatus = {
      platform,
      configured,
      status,
      last_fetch: new Date().toISOString(),
      is_demo: isDemo,
      error_message: errorMessage || null
    };

    this.cache.set(platform, item);

    try {
      await pgPool.query(`
        INSERT INTO connector_status (platform, configured, status, last_fetch, is_demo, error_message, updated_at)
        VALUES ($1, $2, $3, NOW(), $4, $5, NOW())
        ON CONFLICT (platform) DO UPDATE SET
          configured = EXCLUDED.configured,
          status = EXCLUDED.status,
          last_fetch = EXCLUDED.last_fetch,
          is_demo = EXCLUDED.is_demo,
          error_message = EXCLUDED.error_message,
          updated_at = NOW();
      `, [platform, configured, status, isDemo, errorMessage || null]);
    } catch (err) {
      console.error(`Error persisting status for ${platform}:`, err);
    }
  }

  async getAllStatuses(): Promise<ConnectorStatus[]> {
    try {
      const res = await pgPool.query("SELECT platform, configured, status, last_fetch, is_demo, error_message FROM connector_status ORDER BY platform;");
      if (res.rows.length > 0) {
        return res.rows.map(r => ({
          platform: r.platform,
          configured: r.configured,
          status: r.status,
          last_fetch: r.last_fetch ? new Date(r.last_fetch).toISOString() : null,
          is_demo: r.is_demo,
          error_message: r.error_message
        }));
      }
    } catch (err) {
      console.error("Error fetching connector statuses:", err);
    }

    return Array.from(this.cache.values());
  }
}

export const statusTracker = new StatusTracker();
