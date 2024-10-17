import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

let redisClient: RedisClientType;

export function getRedisClient() {
  if (redisClient) return redisClient;

  console.log("redis url", process.env.REDIS_URL);

  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });
  (async () => {
    redisClient.on("error", (err: any) =>
      console.log("Redis Client Error", err)
    );
    await redisClient.connect();
  })();
  return redisClient;
}
