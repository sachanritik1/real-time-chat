import { connection } from "websocket";
import {
  OutgoingMessage,
  SupportedMessage as OutgoingSupportedMessages,
} from "./messages/outgoingMessages";
import { getPublishClient, getSubscribeClient } from "./redis";
import { inMemoryStore } from "./store/inMemoryStore";
import { Room } from "@prisma/client";
import { getPrismaClient } from "./prisma";

// export interface User {
//   id: string;
//   name: string;
//   conn: connection;
// }

const publishClient = getPublishClient();
const subscribeClient = getSubscribeClient();
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

  async subscribeToRoom(roomId: string, socket: connection) {
    await subscribeClient.SUBSCRIBE(roomId, (message) => {
      console.log("Message received in room", roomId, message);
      const { chat, userId } = JSON.parse(message);

      const outgoingPayload: OutgoingMessage = {
        type: OutgoingSupportedMessages.AddChat,
        payload: {
          chatId: chat?.id,
          roomId: roomId,
          userId: userId,
          message: chat.message,
          name: userId,
          upvotes: 0,
        },
      };
      socket.sendUTF(JSON.stringify(outgoingPayload));
    });
  }

  async addUser(
    name: string,
    roomId: string,
    userId: string,
    socket: connection
  ) {
    const room = await inMemoryStore.getRoom(roomId);
    if (!room) return;

    console.log("user id", userId);
    const user = await prismaClient.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log("User not found");
      return;
    }

    await prismaClient.user.update({
      where: { id: userId },
      data: {
        room: {
          connect: {
            id: room?.id,
          },
        },
      },
    });

    await this.subscribeToRoom(roomId, socket);
  }

  async removeUser(roomId: string, userId: string) {
    const room: Room | null = await inMemoryStore.getRoom(roomId);
    if (!room) return;

    const userToRemove = await this.getUser(userId, roomId);
    if (!userToRemove) return;

    await prismaClient.user.update({
      where: { id: userId },
      data: {
        room: undefined,
      },
    });
    console.log("Removed user!!");
  }
}

export const userManager = UserManager.getInstance();
