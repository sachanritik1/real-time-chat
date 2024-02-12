"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var websocket_1 = require("websocket");
var http_1 = require("http");
var incomingMessages_1 = require("./messages/incomingMessages");
var userManager_1 = require("./userManager");
var inMemoryStore_1 = require("./store/inMemoryStore");
var outgoingMessages_1 = require("./messages/outgoingMessages");
var server = http_1.default.createServer(function (request, response) {
    console.log(new Date() + " Received request for " + request.url);
    response.writeHead(404);
    response.end();
});
var userManager = new userManager_1.UserManager();
var store = new inMemoryStore_1.InMemoryStore();
server.listen(8080, function () {
    console.log(new Date() + " Server is listening on port 8080");
});
var wsServer = new websocket_1.server({
    httpServer: server,
    autoAcceptConnections: false,
});
function originIsAllowed(origin) {
    return true;
}
wsServer.on("request", function (request) {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log(new Date() + " Connection from origin " + request.origin + " rejected.");
        return;
    }
    var connection = request.accept(null, request.origin);
    console.log(new Date() + " Connection accepted.");
    connection.on("message", function (message) {
        if (message.type === "utf8") {
            try {
                var obj = JSON.parse(message.utf8Data);
                MessageHandler(connection, obj);
            }
            catch (e) {
                console.log(e);
            }
        }
    });
    connection.on("close", function (reasonCode, description) {
        console.log(new Date() + " Peer " + connection.remoteAddress + " disconnected.");
    });
});
function MessageHandler(socket, message) {
    var type = message.type, payload = message.payload;
    if (type === incomingMessages_1.SupportedMessage.JoinRoom) {
        userManager.addUser(payload.name, payload.roomId, payload.userId, socket);
    }
    else if (type === incomingMessages_1.SupportedMessage.SendMessage) {
        var roomId = payload.roomId, userId = payload.userId, message_1 = payload.message;
        var user = userManager.getUser(roomId, userId);
        if (!user) {
            console.log("User and room have mismatched!!!");
            return;
        }
        var chat = store.addChat(roomId, userId, message_1);
        if (!chat) {
            console.log("Chat not found");
            return;
        }
        var outgoingPayload = {
            type: outgoingMessages_1.SupportedMessage.AddChat,
            payload: {
                chatId: chat === null || chat === void 0 ? void 0 : chat.chatId,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0,
            },
        };
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
    else if (type === incomingMessages_1.SupportedMessage.UpvoteMessage) {
        var roomId = payload.roomId, userId = payload.userId, chatId = payload.chatId;
        var user = userManager.getUser(roomId, userId);
        if (!user) {
            console.log("User and room have mismatched!!!");
            return;
        }
        var chat = store.upvote(userId, roomId, chatId);
        if (!chat) {
            console.log("Chat not found");
            return;
        }
        var outgoingPayload = {
            type: outgoingMessages_1.SupportedMessage.UpdateChat,
            payload: {
                chatId: payload.chatId,
                roomId: payload.roomId,
                upvotes: chat.upvotes.length,
            },
        };
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
    else {
        console.log("unsupported message type");
        return;
    }
}
