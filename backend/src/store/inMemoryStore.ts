import { Chat, store, userId } from "./store";
let globalChatId = 0;

export interface Room {
  roomId: string;
  chats: Chat[];
}

export class InMemoryStore implements store {
  private store: Map<string, Room>; //roomId => chat[]

  constructor() {
    this.store = new Map<string, Room>();
  }

  initRoom(roomId: string) {
    if (this.store.get(roomId)) {
      return;
    }
    const room = this.store.set(roomId, {
      roomId,
      chats: [],
    });
    return room;
  }

  getRoom(roomId: string) {
    return this.store.get(roomId);
  }

  getRoomIds() {
    return Array.from(this.store.keys());
  }

  getChatLimitOffset() {}

  getChats(roomId: string, limit: number, offset: number) {
    const room = this.store.get(roomId);
    if (!room) return [];
    return room.chats.slice(offset, offset + limit);
  }
  addChat(roomId: string, userId: userId, message: string) {
    // if (!this.store.get(roomId)) {
    //   this.initRoom(roomId);
    // }
    const room = this.store.get(roomId);
    if (!room) {
      return;
    }
    const chat: Chat = {
      chatId: (globalChatId++).toString(),
      userId,
      message,
      upvotes: [],
      createdAt: new Date(),
    };
    room.chats.push(chat);
    return chat;
  }
  upvote(userId: userId, roomId: string, chatId: string) {
    const room = this.store.get(roomId);
    if (!room) return;

    const chat = room.chats.find((chat) => chat.chatId === chatId);
    if (!chat) return;

    chat.upvotes.push(userId);
    return chat;
  }
}
