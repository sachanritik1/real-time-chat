import { connection } from "websocket";
import {
  OutgoingMessage,
  SupportedMessage as OutgoingSupportedMessages,
} from "./messages/outgoingMessages";
import { getRedisClient } from "./redis";
import { inMemoryStore } from "./store/inMemoryStore";
import { PrismaClient, Room, User } from "@prisma/client";
import { getPrismaClient } from "./prisma";

// export interface User {
//   id: string;
//   name: string;
//   conn: connection;
// }

const redisClient = getRedisClient();
const primasClient = getPrismaClient();

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
    const user = await primasClient.user?.findUnique({
      where,
    });
    return user;
  }

  async subscribeToRoom(roomId: string, socket: connection) {
    await redisClient.SUBSCRIBE(roomId, (message) => {
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
    let _roomId = room?.id;
    if (!room) return;

    _roomId = await inMemoryStore.initRoom(roomId);

    await primasClient.user.update({
      where: { id: userId },
      data: {
        room: {
          connect: {
            id: _roomId,
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

    await primasClient.user.update({
      where: { id: userId },
      data: {
        room: undefined,
      },
    });
    console.log("Removed user!!");
  }

  // async broadcast(roomId: string, userId: string, message: OutgoingMessage) {
  //   const room: Room | null = await inMemoryStore.getRoom(roomId);
  //   if (!room) {
  //     console.error("Rom rom not found");
  //     return;
  //   }
  //   const user: User | undefined = room.users.find(
  //     (user: User) => user.id === userId
  //   );
  //   if (!user) {
  //     console.error("User not found");
  //     return;
  //   }
  //   room.users.forEach(({ conn, id }) => {
  //     if (id !== userId) {
  //       console.log("outgoing message " + JSON.stringify(message));
  //       conn.sendUTF(JSON.stringify(message));
  //     }
  //   });
  // }
}

export const userManager = UserManager.getInstance();
