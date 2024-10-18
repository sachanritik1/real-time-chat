import ChatInput from "./ChatInput";
import Chat from "./Chat";
import { useEffect, useState } from "react";
import { ChatType } from "../constants";
import { SupportedOutgoingMessage } from "../constants";
import { useRecoilValue } from "recoil";
import { userAtom, wsAtom, currentRoomIdAtom } from "../store/store";

const Chats = () => {
  const user = useRecoilValue(userAtom);
  const ws = useRecoilValue(wsAtom);
  const currentRoomId = useRecoilValue(currentRoomIdAtom);
  const [chats, setChats] = useState<ChatType[]>([]);

  useEffect(() => {
    if (!ws) return;
    ws.onmessage = async (message) => {
      console.log(message.data);
      const outgoingMessage = JSON.parse(message.data);
      if (outgoingMessage.type === SupportedOutgoingMessage.AddChat) {
        setChats((prevChats) => [outgoingMessage.payload, ...prevChats]);
      } else if (outgoingMessage.type === SupportedOutgoingMessage.UpdateChat) {
        const chat = chats.find(
          (c) => c.chatId == outgoingMessage.payload.chatId
        );
        const updatedChat = {
          ...chat,
          ...outgoingMessage.payload,
        };
        setChats([...chats, updatedChat]);
      } else {
        console.log("Unsupported Message Types");
      }
    };
  }, []);

  useEffect(() => {
    setChats([]);
  }, [currentRoomId]);

  return (
    <div className="flex flex-col flex-auto h-full p-6">
      <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4">
        {chats.length > 0 ? (
          <div className="flex flex-col h-full overflow-x-auto mb-4">
            <div className="flex flex-col h-full">
              <div className="flex flex-col-reverse overflow-y-scroll">
                {chats.map((chat) => (
                  <Chat
                    key={chat.chatId}
                    left={chat?.userId !== user?.userId}
                    chat={chat}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center my-auto italic font-semibold">
            No Chats Yet
          </div>
        )}
        <ChatInput />
      </div>
    </div>
  );
};

export default Chats;
