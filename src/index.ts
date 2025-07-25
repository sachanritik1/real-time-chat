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
import bcrypt from "bcryptjs";
import { generateToken } from "./auth/jwt";
import { authMiddleware, AuthRequest } from "./auth/middleware";
import { requireWebSocketAuth } from "./auth/websocket";

const prismaClient = getPrismaClient();

wsServer.on("request", function (request) {
  // Authenticate WebSocket connection
  const authResult = requireWebSocketAuth(request);
  
  if (!authResult.success) {
    request.reject(401, authResult.error);
    console.log(new Date() + " WebSocket connection rejected: " + authResult.error);
    return;
  }
  
  const connection = request.accept(null, request.origin);
  console.log(new Date() + " Authenticated connection accepted for user: " + authResult.user?.name);
  
  // Store user info in connection
  (connection as any).user = authResult.user;
  
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
  
  // Get authenticated user from socket
  const authenticatedUser = (socket as any).user;
  if (!authenticatedUser) {
    console.log("No authenticated user found in socket");
    return;
  }

  const { type, payload } = message;
  if (type === IncomingSupportedMessage.JoinRoom) {
    const room = await userManager.addUser(
      payload.roomId,
      authenticatedUser.userId, // Use authenticated user ID
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
    const { roomId, message: chatMessage } = payload;
    // Use authenticated user's data
    await store.addChat(roomId, authenticatedUser.userId, chatMessage, authenticatedUser.name);
  } else {
    console.log("unsupported message type");
    return;
  }
}

app.post("/create/room", authMiddleware, async function (req: AuthRequest, res) {
  const name = req.body.name;
  const room = await store.initRoom(name);
  res.status(200).json({ room });
});

app.get("/rooms", async function (req, res) {
  const rooms = await store.getRooms();
  res.status(200).json({ rooms });
});

app.get("/room/:roomId", authMiddleware, async function (req: AuthRequest, res) {
  const roomId = req.params.roomId;
  const room = await store.getRoom(roomId);
  res.status(200).json({ room });
});

app.post("/register", async function (req, res) {
  try {
    const { name, email, password } = z
      .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
      .parse(req.body);

    // Check if user already exists
    const existingUser = await prismaClient.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = await prismaClient.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const token = generateToken(user);
    
    // Set cookie with token
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(201).json({ 
      user: { id: user.id, name: user.name, email: user.email }, 
      token 
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors[0].message });
    }
    console.error("Registration error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async function (req, res) {
  try {
    const { email, password } = z
      .object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
      })
      .parse(req.body);

    // Find user by email
    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user);
    
    // Set cookie with token
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(200).json({ 
      user: { id: user.id, name: user.name, email: user.email }, 
      token 
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors[0].message });
    }
    console.error("Login error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/logout", authMiddleware, async function (req: AuthRequest, res) {
  // Clear the auth cookie
  res.clearCookie('auth-token');
  res.status(200).json({ message: 'Logged out successfully' });
});

app.get("/me", authMiddleware, async function (req: AuthRequest, res) {
  // Return current user info
  res.status(200).json({ user: req.user });
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
