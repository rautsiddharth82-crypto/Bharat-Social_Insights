import Redis from "ioredis";
import { config } from "../config.js";

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  username: config.redis.username,
  lazyConnect: true
});

export async function initRedis() {
  try {
    await redisClient.connect();
    console.log("Connected to Redis successfully.");
  } catch (err) {
    console.error("Redis connection error:", err);
  }
}
