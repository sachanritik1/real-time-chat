export abstract class Store {
  constructor() {}
  initRoom(roomId: string) {}
  getRoom(roomId: string) {}
  getChatLimitOffset() {}
  getChats(roomId: string, limit: number, offset: number) {}
  addChat(roomId: string, userId: string, message: string, name: string) {}
  // upvote(userId: userId, roomId: string, chatId: string) {}
}
