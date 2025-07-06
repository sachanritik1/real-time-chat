import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const url = process.env.REDIS_HTTP_URL;
const token = process.env.REDIS_TOKEN;

// Singleton pattern for the Redis clients
let publishClient: Redis | null = null;
let subscribeClient: Redis | null = null;

// Create a Redis publish client
export function getPublishClient() {
  if (publishClient) return publishClient;

  publishClient = new Redis({
    url,
    token,
  });

  // // Connect and set up error handling
  // (async () => {
  //   try {
  //     publishClient.("error", (err) =>
  //       console.log("Publish Client Error", err)
  //     );
  //     await publishClient.connect();
  //     console.log("Publish client connected to Redis:", url);
  //   } catch (e) {
  //     console.error("Error connecting publish client:", e);
  //   }
  // })();

  return publishClient;
}

// Create a Redis subscribe client
export function getSubscribeClient() {
  if (subscribeClient) return subscribeClient;

  subscribeClient = new Redis({
    url,
    token,
  });

  // // Connect and set up error handling
  // (async () => {
  //   try {
  //     subscribeClient.on("error", (err) =>
  //       console.log("Subscribe Client Error", err)
  //     );
  //     await subscribeClient.connect();
  //     console.log("Subscribe client connected to Redis:", url);
  //   } catch (e) {
  //     console.error("Error connecting subscribe client:", e);
  //   }
  // })();

  return subscribeClient;
}
