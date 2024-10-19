import { connection } from "websocket";

import {
  IncomingMessage,
  SupportedMessage as IncomingSupportedMessage,
} from "./messages/incomingMessages";
import { userManager } from "./userManager";
import { inMemoryStore as store } from "./store/inMemoryStore";
import { wsServer, app } from "./app";
import { getPrismaClient } from "./prisma";

const prismaClient = getPrismaClient();

wsServer.on("request", function (request) {
  const connection = request.accept(null, request.origin);
  console.log(new Date() + " Connection accepted.");
  connection.on("message", async function (message) {
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

async function MessageHandler(socket: connection, message: IncomingMessage) {
  console.log("Received Message: ", message);

  const { type, payload } = message;
  if (type === IncomingSupportedMessage.JoinRoom) {
    userManager.addUser(payload.name, payload.roomId, payload.userId, socket);
  } else if (type === IncomingSupportedMessage.SendMessage) {
    const { roomId, userId, message } = payload;
    const chat = await store.addChat(roomId, userId, message);
    if (!chat) {
      console.log("Chat not found");
      return;
    }
    // const outgoingPayload: OutgoingMessage = {
    //   type: OutgoingSupportedMessages.AddChat,
    //   payload: {
    //     chatId: chat?.id,
    //     roomId: payload.roomId,
    //     userId: payload.userId,
    //     message: payload.message,
    //     name: user.name,
    //     upvotes: 0,
    //   },
    // };
    // userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
  } else {
    console.log("unsupported message type");
    return;
  }
}

app.post("/create/room", async function (req, res) {
  const roomId = req.body.roomId;
  const room = await store.initRoom(roomId);
  if (!room) {
    res.status(400).json({ message: "Room already exists" });
    return;
  }
  res.status(200).json({ roomId });
});

app.get("/rooms", async function (req, res) {
  const rooms = await store.getRooms();
  if (!rooms) {
    res.status(400).json({ message: "No rooms found" });
    return;
  }
  res.status(200).json({ rooms });
});

app.get("/room/:roomId", async function (req, res) {
  const roomId = req.params.roomId;
  const room = await store.getRoom(roomId);
  if (!room) {
    res.status(400).json({ message: "Room not found" });
    return;
  }
  res.status(200).json({ room });
});

app.post("/login", async function (req, res) {
  const { name, id } = req.body;
  const user = await prismaClient.user.findUnique({ where: { id } });
  if (user) {
    res.status(200).json({ user });
    return;
  }
  const newUser = await prismaClient.user.create({
    data: {
      id,
      name,
      email: new Date().getTime() + "@gmail.com",
      password: "",
    },
  });

  return res.status(200).json(newUser);
});
