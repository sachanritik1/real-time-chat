import { Room } from "@prisma/client";

export enum SupportedMessage {
  AddChat = "ADD_CHAT",
  UpdateChat = "UPDATE_CHAT",
  JoinedRoom = "JOINED_ROOM",
}

type MessagePayload = {
  roomId: string;
  message: string;
  userId: string;
  name: string;
  upvotes: number;
  chatId: string;
};

export type OutgoingMessage =
  | {
      type: SupportedMessage.AddChat;
      payload: MessagePayload;
    }
  | {
      type: SupportedMessage.UpdateChat;
      payload: Partial<MessagePayload>;
    }
  | {
      type: SupportedMessage.JoinedRoom;
      payload: Room;
    };
