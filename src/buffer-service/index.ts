import { Chat } from "@prisma/client";
import { getPrismaClient } from "../prisma";
import { getPublishClient } from "../redis";

const publishClient = getPublishClient();
const prismaClient = getPrismaClient();

const saveChatsToDatabase = async () => {
  // Get all chats from the Redis buffer
  const chats = await publishClient.lRange("chatBuffer", 0, -1);

  if (chats.length === 0) {
    console.log("No chats to save at the moment.");
    return;
  }

  // Parse chats from Redis and prepare them for bulk insertion
  const parsedChats: Chat[] = chats.map((chat) => JSON.parse(chat)?.chat);

  const existingUsers = await prismaClient.user.findMany({
    where: { id: { in: parsedChats.map((chat) => chat.userId) } },
  });

  const existingRooms = await prismaClient.room.findMany({
    where: { id: { in: parsedChats.map((chat) => chat.roomId) } },
  });

  const validUserIds = new Set(existingUsers.map((user) => user.id));
  const validRoomIds = new Set(existingRooms.map((room) => room.id));

  const validChats = parsedChats.filter(
    (chat) => validUserIds.has(chat.userId) && validRoomIds.has(chat.roomId)
  );

  console.log("validChats", validChats);

  try {
    // Bulk insert chats into the database
    await prismaClient.chat.createMany({
      data: validChats,
    });

    console.log(`Saved ${validChats.length} chats to the database.`);

    // Remove the chats from the Redis buffer after saving
    await publishClient.lTrim("chatBuffer", chats.length, -1); // Clears the processed items
  } catch (error) {
    console.error("Error saving chats:", error);
  }
};

// Run this function every 1 minute (60000 ms)
setInterval(saveChatsToDatabase, 60000);
