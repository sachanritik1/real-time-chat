import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const url = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: RedisClientType;

export function getRedisClient() {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: url,
  });
  try {
    (async () => {
      redisClient.on("error", (err: any) =>
        console.log("Redis Client Error", err)
      );
      await redisClient.connect();
      console.log("Redis connected with: ", url);
    })();
  } catch (e) {
    console.log(e);
  }
  return redisClient;
}
