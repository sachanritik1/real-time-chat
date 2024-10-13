import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType;

export function getRedisClient() {
  if (redisClient) return redisClient;

  redisClient = createClient();
  (async () => {
    redisClient.on("error", (err: any) =>
      console.log("Redis Client Error", err)
    );
    await redisClient.connect();
  })();
  return redisClient;
}
