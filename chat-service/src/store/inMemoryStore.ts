import { Chat, Room } from "@prisma/client";
import { getPrismaClient } from "../prisma";
import { getRedisClient } from "../redis";
import { Store } from "./store";
let globalChatId = 0;

// export interface Room {
//   roomId: string;
//   chats: Chat[];
//   users: User[];
// }

const redisClient = getRedisClient();
const primaClient = getPrismaClient();

class InMemoryStore implements Store {
  private static instance: InMemoryStore;

  private constructor() {}

  static getInstance() {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  // 1. Initialize a room in Redis
  async initRoom(roomId: string) {
    let room = await primaClient.room.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      room = await primaClient.room.create({ data: { name: roomId } });
    }
    return room?.id;
  }

  // 2. Get a room
  async getRoom(roomId: string): Promise<Room | null> {
    const room = await primaClient.room.findUnique({
      where: { id: roomId },
    });
    return room;
  }

  // 3. Fetch chat history with limit and offset
  async getChats(
    roomId: string,
    limit: number,
    offset: number
  ): Promise<Chat[]> {
    const chats: Chat[] = await primaClient.chat.findMany({
      where: { room: { id: roomId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
    return chats;
  }

  getChatLimitOffset() {}

  async getRooms() {
    const rooms = await primaClient.room.findMany();
    return rooms;
  }

  async getRoomIds(): Promise<string[]> {
    const rooms = await this.getRooms();
    const roomIds = rooms.map((room) => room.id);
    return roomIds;
  }

  // 4. Add a new chat to a room in Redis and broadcast via Pub/Sub
  async addChat(
    roomId: string,
    userId: string,
    message: string
  ): Promise<Chat | null> {
    // add chat to redis buffer to bulk save later on db
    // publish the chat to redis pub/sub for real-time chats

    // Create a new chat message
    const chat: Chat = {
      id: String(globalChatId++),
      message,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // push in buffer
    await redisClient.RPUSH(
      "chatBuffer",
      JSON.stringify({ chat, roomId, userId })
    );

    // Publish the new chat to Redis Pub/Sub
    await redisClient.PUBLISH(roomId, JSON.stringify({ chat, userId }));
    return chat;
  }
}

export const inMemoryStore = InMemoryStore.getInstance();
