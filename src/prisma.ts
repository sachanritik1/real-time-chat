import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const url = process.env.REDIS_URL || "redis://localhost:6379";

let prismaClient: PrismaClient;

export function getPrismaClient() {
  if (prismaClient) return prismaClient;
  prismaClient = new PrismaClient();
  return prismaClient;
}
