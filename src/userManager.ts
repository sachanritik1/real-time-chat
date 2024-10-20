import { connection } from "websocket";
import { inMemoryStore } from "./store/inMemoryStore";
import { Room } from "@prisma/client";
import { getPrismaClient } from "./prisma";
import { subscribeToRoom } from "./store/subscriptions";

const prismaClient = getPrismaClient();

class UserManager {
  private static instance: UserManager;
  private constructor() {}

  static getInstance() {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  async getUser(userId: string, roomId?: string) {
    const where: { id: string; room?: { id: string } } = { id: userId };
    if (roomId) {
      where.room = { id: roomId };
    }
    const user = await prismaClient.user?.findUnique({
      where,
    });
    return user;
  }

  async addUser(
    name: string,
    roomId: string,
    userId: string,
    socket: connection
  ) {
    const room = await inMemoryStore.getRoom(roomId);
    if (!room) return null;

    console.log("user id", userId);
    const user = await prismaClient.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log("User not found");
      return null;
    }

    await prismaClient.user.update({
      where: { id: userId },
      data: {
        roomId,
      },
    });

    await subscribeToRoom(roomId, socket);

    return room;
  }

  async removeUser(roomId: string, userId: string) {
    const room: Room | null = await inMemoryStore.getRoom(roomId);
    if (!room) return;

    const userToRemove = await this.getUser(userId, roomId);
    if (!userToRemove) return;

    await prismaClient.user.update({
      where: { id: userId },
      data: {
        roomId: undefined,
      },
    });
    console.log("Removed user!!");
  }
}

export const userManager = UserManager.getInstance();
