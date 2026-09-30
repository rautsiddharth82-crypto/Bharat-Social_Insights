import axios from "axios";
import { config } from "../config.js";

export class MLClient {
  private baseUrl = config.mlServiceUrl;

  async getHealth() {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return res.data;
    } catch (err) {
      console.warn("ML Service health check unreachable, using internal fallback.");
      return { status: "unreachable" };
    }
  }

  // CPU inference on a cold model can exceed 5s, so timeouts are generous —
  // otherwise the worker silently falls back to "neutral" for every post.
  async inferSentimentBatch(texts: string[]) {
    try {
      const res = await axios.post(`${this.baseUrl}/infer/sentiment`, { texts }, { timeout: 30000 });
      return res.data.results;
    } catch (err) {
      console.warn(`[ML] sentiment fallback used (${(err as Error).message})`);
      return texts.map(() => ({
        sentiment: "neutral",
        sentiment_score: 0.0,
        emotions: { anxiety: 0.1 }
      }));
    }
  }

  async inferStanceBatch(items: Array<{ text: string; topic_name: string }>) {
    try {
      const res = await axios.post(`${this.baseUrl}/infer/stance`, { items }, { timeout: 30000 });
      return res.data.results;
    } catch (err) {
      console.warn(`[ML] stance fallback used (${(err as Error).message})`);
      return items.map(() => "neutral");
    }
  }

  async inferTopicsBatch(texts: string[]) {
    try {
      const res = await axios.post(`${this.baseUrl}/infer/topics`, { texts }, { timeout: 30000 });
      return res.data.results;
    } catch (err) {
      console.warn(`[ML] topics fallback used (${(err as Error).message})`);
      return texts.map(() => ({
        topic_id: "topic_general",
        topic_name: "General Discussion",
        keywords: ["general"]
      }));
    }
  }

  async inferForecastBatch(seriesList: number[][]) {
    try {
      const res = await axios.post(`${this.baseUrl}/infer/forecast`, { series_list: seriesList }, { timeout: 30000 });
      return res.data.results;
    } catch (err) {
      console.warn(`[ML] forecast fallback used (${(err as Error).message})`);
      return seriesList.map(s => ({
        velocity: 0.0,
        forecast_next_hour: s.length ? s[s.length - 1] : 0.0
      }));
    }
  }
}

export const mlClient = new MLClient();
