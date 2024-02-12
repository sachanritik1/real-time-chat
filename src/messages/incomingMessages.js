"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpvoteMessage = exports.UserMessage = exports.InitMessage = exports.SupportedMessage = void 0;
var zod_1 = require("zod");
var SupportedMessage;
(function (SupportedMessage) {
    SupportedMessage["JoinRoom"] = "JOIN_ROOM";
    SupportedMessage["SendMessage"] = "SEND_MESSAGE";
    SupportedMessage["UpvoteMessage"] = "UPVOTE_MESSAGE";
})(SupportedMessage || (exports.SupportedMessage = SupportedMessage = {}));
exports.InitMessage = zod_1.z.object({
    name: zod_1.z.string(),
    userId: zod_1.z.string(),
    roomId: zod_1.z.string(),
});
exports.UserMessage = zod_1.z.object({
    message: zod_1.z.string(),
    userId: zod_1.z.string(),
    roomId: zod_1.z.string(),
});
exports.UpvoteMessage = zod_1.z.object({
    chatId: zod_1.z.string(),
    userId: zod_1.z.string(),
    roomId: zod_1.z.string(),
});
