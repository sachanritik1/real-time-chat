import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const url = process.env.REDIS_URL || "redis://localhost:6379";

// Singleton pattern for the Redis clients
let publishClient: RedisClientType | null = null;
let subscribeClient: RedisClientType | null = null;

// Create a Redis publish client
export function getPublishClient() {
  if (publishClient) return publishClient;

  publishClient = createClient({
    url: url,
  });

  // Connect and set up error handling
  (async () => {
    try {
      publishClient.on("error", (err) =>
        console.log("Publish Client Error", err)
      );
      await publishClient.connect();
      console.log("Publish client connected to Redis:", url);
    } catch (e) {
      console.error("Error connecting publish client:", e);
    }
  })();

  return publishClient;
}

// Create a Redis subscribe client
export function getSubscribeClient() {
  if (subscribeClient) return subscribeClient;

  subscribeClient = createClient({
    url: url,
  });

  // Connect and set up error handling
  (async () => {
    try {
      subscribeClient.on("error", (err) =>
        console.log("Subscribe Client Error", err)
      );
      await subscribeClient.connect();
      console.log("Subscribe client connected to Redis:", url);
    } catch (e) {
      console.error("Error connecting subscribe client:", e);
    }
  })();

  return subscribeClient;
}
