import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

let prismaClient: PrismaClient;

export function getPrismaClient() {
  if (prismaClient) return prismaClient;
  prismaClient = new PrismaClient();
  console.log("Prisma client connected.");
  return prismaClient;
}
