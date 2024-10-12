import { connection } from "websocket";
import { OutgoingMessage } from "./messages/outgoingMessages";

export interface User {
  id: string;
  name: string;
  conn: connection;
}

interface Room {
  users: User[];
}

export class UserManager {
  private map: Map<string, Room>; //roomId => user[]
  constructor() {
    this.map = new Map<string, Room>();
  }

  addUser(name: string, roomId: string, userId: string, socket: connection) {
    const room = this.map.get(roomId);
    const user: User = {
      id: userId,
      name,
      conn: socket,
    };
    if (!room) {
      this.map.set(roomId, {
        users: [user],
      });
    } else {
      const userAlreadyExist = this.map
        .get(roomId)
        ?.users.find((user) => user.id === userId);
      if (userAlreadyExist) {
        return;
      }
      room.users.push(user);
    }
    socket.on("close", (reasonCode, description) => {
      this.removeUser(roomId, userId);
    });
  }

  removeUser(roomId: string, userId: string) {
    const userToRemove = this.getUser(roomId, userId);
    if (!userToRemove) return;
    let remainingUsers = this.map
      .get(roomId)
      ?.users.filter((user) => user.id == userId);
    if (!remainingUsers) remainingUsers = [];
    const room: Room = {
      users: remainingUsers,
    };
    this.map.set(roomId, room);
    console.log("Removed user!!");
  }

  getUser(roomId: string, userId: string) {
    const room = this.map.get(roomId);
    if (!room) return;
    return room.users.find((user) => user.id == userId);
  }

  broadcast(roomId: string, userId: string, message: OutgoingMessage) {
    const user = this.getUser(roomId, userId);
    if (!user) {
      console.error("User not found");
      return;
    }

    const room = this.map.get(roomId);
    if (!room) {
      console.error("Rom rom not found");
      return;
    }

    room.users.forEach(({ conn, id }) => {
      // if (id === userId) {
      //   return;
      // }
      console.log("outgoing message " + JSON.stringify(message));
      conn.sendUTF(JSON.stringify(message));
    });
  }
}
