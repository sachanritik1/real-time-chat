import { connection } from "websocket";
import { getSubscribeClient } from "../redis";
import {
  OutgoingMessage,
  SupportedMessage,
} from "../messages/outgoingMessages";

const subscribeClient = getSubscribeClient();

const map = new Map<string, connection[]>();

export async function subscribeToRoom(roomId: string, socket: connection) {
  console.log("Subscribing to room", roomId);
  if (map.has(roomId)) {
    if (!map.get(roomId)?.includes(socket)) {
      map.set(roomId, [...map.get(roomId)!, socket]);
    }
    // already subscribed
    return;
  }

  map.set(roomId, [socket]);
  const room = subscribeClient.subscribe(roomId);
  room.on("subscribe", () => console.log("Subscribed to room", roomId));
  room.on("message", (payload: any) => {
    console.log("----- Message received in room  -----", roomId, payload);
    const { message } = payload;
    const { chat, userId } = message;

    const outgoingPayload: OutgoingMessage = {
      type: SupportedMessage.AddChat,
      payload: {
        chatId: chat?.id,
        roomId: roomId,
        userId: userId,
        message: chat.message,
        name: chat?.name,
        upvotes: 0,
      },
    };

    map.get(roomId)?.forEach((socket) => {
      socket.sendUTF(JSON.stringify(outgoingPayload));
    });
  });
  room.on("error", (err) => console.log("Error in room", roomId, err));
}
