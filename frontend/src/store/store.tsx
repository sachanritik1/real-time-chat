import { atom } from "recoil";

export type User = {
  userId: string;
  name: string;
};

export const userAtom = atom({
  key: "user",
  default: null as User | null,
});

export type RoomId = string;

export const roomIdsAtom = atom({
  key: "roomIds",
  default: [] as RoomId[],
});

export const wsAtom = atom({
  key: "ws",
  default: null as WebSocket | null,
});

export const currentRoomIdAtom = atom({
  key: "currentRoomId",
  default: null as RoomId | null,
});
