"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStore = void 0;
var globalChatId = 0;
var InMemoryStore = /** @class */ (function () {
    function InMemoryStore() {
        this.store = new Map();
    }
    InMemoryStore.prototype.initRoom = function (roomId) {
        this.store.set(roomId, {
            roomId: roomId,
            chats: [],
        });
    };
    InMemoryStore.prototype.getRoom = function (roomId) {
        return this.store.get(roomId);
    };
    InMemoryStore.prototype.getChatLimitOffset = function () { };
    InMemoryStore.prototype.getChats = function (roomId, limit, offset) {
        var room = this.store.get(roomId);
        if (!room)
            return [];
        return room.chats.slice(offset, offset + limit);
    };
    InMemoryStore.prototype.addChat = function (roomId, userId, message) {
        if (!this.store.get(roomId)) {
            this.initRoom(roomId);
        }
        var room = this.store.get(roomId);
        if (!room) {
            return;
        }
        var chat = {
            chatId: (globalChatId++).toString(),
            userId: userId,
            message: message,
            upvotes: [],
            createdAt: new Date(),
        };
        room.chats.push(chat);
        return chat;
    };
    InMemoryStore.prototype.upvote = function (userId, roomId, chatId) {
        var room = this.store.get(roomId);
        if (!room)
            return;
        var chat = room.chats.find(function (chat) { return chat.chatId === chatId; });
        if (!chat)
            return;
        chat.upvotes.push(userId);
        return chat;
    };
    return InMemoryStore;
}());
exports.InMemoryStore = InMemoryStore;
