import { connection } from "websocket";
import { OutgoingMessage } from "./messages/outgoingMessages";
import { getRedisClient } from "./redis";
import { inMemoryStore, Room } from "./store/inMemoryStore";

export interface User {
  id: string;
  name: string;
  conn: connection;
}

const redisClient = getRedisClient();

class UserManager {
  private static instance: UserManager;
  private constructor() {}

  static getInstance() {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  async addUser(
    name: string,
    roomId: string,
    userId: string,
    socket: connection
  ) {
    const room: Room | null = await inMemoryStore.getRoom(roomId);
    if (!room) {
      console.error("Room not found");
      return;
    }
    const user: User = {
      id: userId,
      name,
      conn: socket,
    };
    console.log("room", room);

    if (room) {
      const userAlreadyExist = room?.users?.find(
        (_user: User) => _user?.id === userId
      );
      console.log("userAlreadyExist", userAlreadyExist);
      if (userAlreadyExist) {
        return;
      }
      const updatedRoom: Room = {
        users: [...room?.users, user],
        chats: room.chats,
        roomId,
      };
      await redisClient.SET(roomId, JSON.stringify(updatedRoom));
    } else {
      const newRoom: Room = { chats: [], users: [user], roomId };
      await redisClient.SET(roomId, JSON.stringify(newRoom));
    }
  }

  async removeUser(roomId: string, userId: string) {
    const room: Room | null = await inMemoryStore.getRoom(roomId);

    if (!room) return;
    const userToRemove = room?.users?.find((user: User) => user.id === userId);
    if (!userToRemove) return;
    let remainingUsers =
      room?.users.filter((user: User) => user.id !== userId) || [];

    const updatedRoom: Room = {
      users: remainingUsers,
      chats: room.chats,
      roomId,
    };
    await redisClient.SET(roomId, JSON.stringify(updatedRoom));
    console.log("Removed user!!");
  }

  async getUser(roomId: string, userId: string) {
    const room: Room | null = await inMemoryStore.getRoom(roomId);
    if (!room) return;
    return room.users.find((user: User) => user.id == userId);
  }

  async broadcast(roomId: string, userId: string, message: OutgoingMessage) {
    const room: Room | null = await inMemoryStore.getRoom(roomId);
    if (!room) {
      console.error("Rom rom not found");
      return;
    }
    const user: User | undefined = room.users.find(
      (user: User) => user.id === userId
    );
    if (!user) {
      console.error("User not found");
      return;
    }
    room.users.forEach(({ conn, id }) => {
      if (id !== userId) {
        console.log("outgoing message " + JSON.stringify(message));
        conn.sendUTF(JSON.stringify(message));
      }
    });
  }
}

export const userManager = UserManager.getInstance();
