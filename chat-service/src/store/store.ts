export type userId = string;

export interface Chat {
  chatId: string;
  userId: string;
  message: string;
  upvotes: userId[];
  createdAt: Date;
}

export abstract class Store {
  constructor() {}
  initRoom(roomId: string) {}
  getRoom(roomId: string) {}
  getChatLimitOffset() {}
  getChats(roomId: string, limit: number, offset: number) {}
  addChat(roomId: string, userId: userId, message: string) {}
  upvote(userId: userId, roomId: string, chatId: string) {}
}
