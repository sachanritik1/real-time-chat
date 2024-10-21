import { connection } from "websocket";
import { getSubscribeClient } from "../redis";
import {
  OutgoingMessage,
  SupportedMessage,
} from "../messages/outgoingMessages";

const subscribeClient = getSubscribeClient();

const map = new Map<string, connection[]>();

export async function subscribeToRoom(roomId: string, socket: connection) {
  if (map.has(roomId)) {
    if (!map.get(roomId)?.includes(socket)) {
      map.set(roomId, [...map.get(roomId)!, socket]);
    }
    // already subscribed
    return;
  }

  map.set(roomId, [socket]);
  await subscribeClient.SUBSCRIBE(roomId, (message) => {
    console.log("Message received in room", roomId, JSON.parse(message));
    const { chat, userId } = JSON.parse(message);

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
}
