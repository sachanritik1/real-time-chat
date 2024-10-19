import { Chat } from "@prisma/client";
import { getPrismaClient } from "../prisma";
import { getPublishClient } from "../redis";
import { Store } from "./store";

let globalChatId = 0;

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
    let room = await prismaClient.room.findFirst({
      where: { name },
    });
    if (!room) {
      room = await prismaClient.room.create({ data: { name } });
    }
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
    const chats: Chat[] = await prismaClient.chat.findMany({
      where: { room: { id: roomId } },
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

  async addChat(roomId: string, userId: string, message: string) {
    // Create a new chat message
    const chat = {
      id: String(globalChatId++),
      message,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      roomId,
    };

    // add chat to redis buffer to bulk save on db later
    await publishClient.RPUSH(
      "chatBuffer",
      JSON.stringify({ chat, roomId, userId })
    );

    // Publish the chat to redis pub/sub for real-time chats
    await publishClient.PUBLISH(roomId, JSON.stringify({ chat, userId }));
  }
}

export const inMemoryStore = InMemoryStore.getInstance();
