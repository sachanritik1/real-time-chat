import { server as WebSocketServer, connection } from "websocket";
import http from "http";
import {
  IncomingMessage,
  SupportedMessage as IncomingSupportedMessage,
} from "./messages/incomingMessages";
import { UserManager } from "./userManager";
import { InMemoryStore } from "./store/inMemoryStore";
import {
  OutgoingMessage,
  SupportedMessage as OutgoingSupportedMessages,
} from "./messages/outgoingMessages";

const server = http.createServer(function (request, response) {
  console.log(new Date() + " Received request for " + request.url);
  response.writeHead(404);
  response.end();
});

const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8080, function () {
  console.log(new Date() + " Server is listening on port 8080");
});

const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
});

function originIsAllowed(origin: string) {
  return true;
}

wsServer.on("request", function (request) {
  if (!originIsAllowed(request.origin)) {
    request.reject();
    console.log(
      new Date() + " Connection from origin " + request.origin + " rejected."
    );
    return;
  }

  var connection = request.accept(null, request.origin);
  console.log(new Date() + " Connection accepted.");
  connection.on("message", function (message) {
    if (message.type === "utf8") {
      try {
        const obj = JSON.parse(message.utf8Data);
        MessageHandler(connection, obj);
      } catch (e) {
        console.log(e);
      }
    }
  });

  connection.on("close", function (reasonCode, description) {
    console.log(
      new Date() + " Peer " + connection.remoteAddress + " disconnected."
    );
  });
});

function MessageHandler(socket: connection, message: IncomingMessage) {
  const { type, payload } = message;
  if (type === IncomingSupportedMessage.JoinRoom) {
    userManager.addUser(payload.name, payload.roomId, payload.userId, socket);
  } else if (type === IncomingSupportedMessage.SendMessage) {
    const { roomId, userId, message } = payload;
    const user = userManager.getUser(roomId, userId);
    if (!user) {
      console.log("User and room have mismatched!!!");
      return;
    }
    const chat = store.addChat(roomId, userId, message);
    if (!chat) {
      console.log("Chat not found");
      return;
    }
    const outgoingPayload: OutgoingMessage = {
      type: OutgoingSupportedMessages.AddChat,
      payload: {
        chatId: chat?.chatId,
        roomId: payload.roomId,
        message: payload.message,
        name: user.name,
        upvotes: 0,
      },
    };
    userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
  } else if (type === IncomingSupportedMessage.UpvoteMessage) {
    const { roomId, userId, chatId } = payload;
    const user = userManager.getUser(roomId, userId);
    if (!user) {
      console.log("User and room have mismatched!!!");
      return;
    }
    const chat = store.upvote(userId, roomId, chatId);
    if (!chat) {
      console.log("Chat not found");
      return;
    }
    const outgoingPayload: OutgoingMessage = {
      type: OutgoingSupportedMessages.UpdateChat,
      payload: {
        chatId: payload.chatId,
        roomId: payload.roomId,
        upvotes: chat.upvotes.length,
      },
    };
    userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
  } else {
    console.log("unsupported message type");
    return;
  }
}
