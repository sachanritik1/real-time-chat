import { Chat } from "@prisma/client";
import { getPrismaClient } from "../prisma";
import { getPublishClient } from "../redis";
import { Store } from "./store";

const publishClient = getPublishClient();
const prismaClient = getPrismaClient();

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
  async initRoom(name: string) {
    const room = await prismaClient.room.create({ data: { name } });
    return room;
  }

  // 2. Get a room
  async getRoom(roomId: string) {
    const room = await prismaClient.room.findUnique({
      where: { id: roomId },
    });
    return room;
  }

  // 3. Fetch chat history with limit and offset
  async getChats(roomId: string, limit: number, offset: number) {
    const chats = await prismaClient.chat.findMany({
      where: { room: { id: roomId } },
      include: { user: true, room: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
    return chats;
  }

  getChatLimitOffset() {}

  async getRooms() {
    const rooms = await prismaClient.room.findMany();
    return rooms;
  }

  async addChat(roomId: string, userId: string, message: string, name: string) {
    // Create a new chat message
    const chat = {
      id: Date.now().toString() + Math.random().toFixed(5).toString(),
      message,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      roomId,
      name,
    };

    // add chat to redis buffer to bulk save on db later
    await publishClient.RPUSH(
      "chatBuffer",
      JSON.stringify({ chat, roomId, userId })
    );

    // Publish the chat to redis pub/sub for real-time chats
    await publishClient.PUBLISH(
      roomId,
      JSON.stringify({
        chat: {
          id: chat.id,
          message: chat.message,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          userId: chat.userId,
          roomId: chat.roomId,
          name: chat.name,
        },
        userId,
      })
    );
  }
}

export const inMemoryStore = InMemoryStore.getInstance();
