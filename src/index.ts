import { connection } from "websocket";

import {
  IncomingMessage,
  SupportedMessage as IncomingSupportedMessage,
} from "./messages/incomingMessages";
import { userManager } from "./userManager";
import { inMemoryStore as store } from "./store/inMemoryStore";
import { wsServer, app } from "./app";
import { getPrismaClient } from "./prisma";
import { SupportedMessage as OutgoingSupportedMessage } from "./messages/outgoingMessages";
import { z } from "zod";

const prismaClient = getPrismaClient();

wsServer.on("request", function (request) {
  const connection = request.accept(null, request.origin);
  console.log(new Date() + " Connection accepted.");
  connection.on("message", async function (message) {
    if (message.type === "utf8") {
      try {
        const obj = JSON.parse(message.utf8Data);
        await MessageHandler(connection, obj);
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
    const room = await userManager.addUser(
      payload.roomId,
      payload.userId,
      socket
    );
    if (room) {
      socket.send(
        JSON.stringify({
          type: OutgoingSupportedMessage.JoinedRoom,
          payload: room,
        })
      );
    }
  } else if (type === IncomingSupportedMessage.SendMessage) {
    const { roomId, userId, message, name } = payload;
    await store.addChat(roomId, userId, message, name);
  } else {
    console.log("unsupported message type");
    return;
  }
}

app.post("/create/room", async function (req, res) {
  const name = req.body.name;
  const room = await store.initRoom(name);
  res.status(200).json({ room });
});

app.get("/rooms", async function (req, res) {
  const rooms = await store.getRooms();
  res.status(200).json({ rooms });
});

app.get("/room/:roomId", async function (req, res) {
  const roomId = req.params.roomId;
  const room = await store.getRoom(roomId);
  res.status(200).json({ room });
});

app.post("/login", async function (req, res) {
  try {
    const { name, email } = z
      .object({
        name: z.string(),
        email: z.string().email(),
      })
      .parse(req.body);

    const user = await prismaClient.user.findUnique({ where: { email } });
    if (user) {
      res.status(200).json({ user });
      return;
    }

    const newUser = await prismaClient.user.create({
      data: {
        name,
        email,
        password: "",
      },
    });
    return res.status(200).json({ user: newUser });
  } catch (e) {
    res.status(400).json({ e });
    console.log(e);
  }
});

app.get("/chat/:roomId", async function (req, res) {
  const roomId = req.params.roomId;
  const chats = await store.getChats(roomId, 100, 0);
  const response = chats.map((chat) => {
    return {
      ...chat,
      name: chat.user.name,
    };
  });
  res.status(200).json({ chats: response });
});
