"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
var store = /** @class */ (function () {
    function store() {
    }
    store.prototype.initRoom = function (roomId) { };
    store.prototype.getRoom = function (roomId) { };
    store.prototype.getChatLimitOffset = function () { };
    store.prototype.getChats = function (roomId, limit, offset) { };
    store.prototype.addChat = function (roomId, userId, message) { };
    store.prototype.upvote = function (userId, roomId, chatId) { };
    return store;
}());
exports.store = store;
