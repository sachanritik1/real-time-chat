import { connection } from "websocket";

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
import { wsServer, app } from "./app";

const userManager = UserManager.getInstance();
const store = new InMemoryStore();

wsServer.on("request", function (request) {
  const connection = request.accept(null, request.origin);
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
  console.log("Received Message: ", message);

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
        userId: payload.userId,
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

app.post("/create/room", function (req, res) {
  const roomId = req.body.roomId;
  const room = store.initRoom(roomId);
  if (!room) {
    res.status(400).json({ message: "Room already exists" });
    return;
  }
  res.status(200).json({ roomId });
});

app.get("/rooms", function (req, res) {
  const roomIds = store.getRoomIds();
  if (!roomIds) {
    res.status(400).json({ message: "No rooms found" });
    return;
  }
  res.status(200).json({ roomIds: roomIds });
});

app.get("/room/:roomId", function (req, res) {
  const roomId = req.params.roomId;
  const room = store.getRoom(roomId);
  if (!room) {
    res.status(400).json({ message: "Room not found" });
    return;
  }
  res.status(200).json({ room });
});
