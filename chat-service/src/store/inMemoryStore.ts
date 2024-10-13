import { getRedisClient } from "../redis";
import { Chat, Store, userId } from "./store";
let globalChatId = 0;

export interface Room {
  roomId: string;
  chats: Chat[];
}

const redisClient = getRedisClient();

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
    const room = await redisClient.GET(roomId);
    if (room) return false; // Room already exists in Redis

    const newRoom: Room = { roomId, chats: [] };
    await redisClient.SET(roomId, JSON.stringify(newRoom));
    return true;
  }

  // 2. Get a room and its chats from Redis
  async getRoom(roomId: string): Promise<Room | null> {
    const roomData = await redisClient.GET(roomId);
    if (!roomData) return null;
    return JSON.parse(roomData);
  }

  // 3. Fetch chat history with limit and offset
  async getChats(
    roomId: string,
    limit: number,
    offset: number
  ): Promise<Chat[]> {
    const room: Room | null = await this.getRoom(roomId);
    if (!room) return [];

    // Slice the chats for pagination
    return room.chats.slice(offset, offset + limit);
  }

  getChatLimitOffset() {}

  async getRoomIds(): Promise<string[]> {
    // Fetch all keys from Redis
    const keys = await redisClient.KEYS("*");
    return keys;
  }

  // 4. Add a new chat to a room in Redis and broadcast via Pub/Sub
  async addChat(
    roomId: string,
    userId: string,
    message: string
  ): Promise<Chat | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    // Create a new chat message
    const chat: Chat = {
      chatId: (globalChatId++).toString(),
      userId,
      message,
      upvotes: [],
      createdAt: new Date(),
    };

    // Update room with the new chat
    room.chats.push(chat);
    await redisClient.SET(roomId, JSON.stringify(room));

    // Publish the new chat to Redis Pub/Sub
    await redisClient.PUBLISH(roomId, JSON.stringify(chat));

    return chat;
  }

  // 5. Upvote a chat in Redis
  async upvote(
    roomId: string,
    userId: userId,
    chatId: string
  ): Promise<Chat | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const chat = room.chats.find((c) => c.chatId === chatId);
    if (!chat) return null;

    // Add the userId to the upvotes
    chat.upvotes.push(userId);

    // Update room in Redis
    await redisClient.SET(roomId, JSON.stringify(room));

    return chat;
  }

  // 6. Handle Redis Pub/Sub message events for broadcasting
  async subscribeToRoom(roomId: string) {
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.SUBSCRIBE(roomId, (message) => {
      const chat = JSON.parse(message);
      // Broadcast this chat to all users connected to this server
      console.log(`New message in room ${roomId}: ${chat.message}`);
    });
  }
}

export const inMemoryStore = InMemoryStore.getInstance();
