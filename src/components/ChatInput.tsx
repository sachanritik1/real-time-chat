import { useRef } from "react";
import { useRecoilValue } from "recoil";
import { userAtom } from "../store/store";
import { SupportedIncomingMessage } from "../constants";
import { wsAtom } from "../store/store";
import { currentRoomIdAtom } from "../store/store";

const ChatInput = () => {
  const user = useRecoilValue(userAtom);
  const ws = useRecoilValue(wsAtom);
  const currentRoomId = useRecoilValue(currentRoomIdAtom);

  const addChat = (message: string) => {
    if (message) {
      const newChat = {
        roomId: currentRoomId,
        userId: user?.userId,
        message,
      };
      const data = {
        type: SupportedIncomingMessage.SendMessage,
        payload: newChat,
      };
      if (!ws) return;
      ws?.send(JSON.stringify(data));
    }
  };

  const chatRef = useRef<HTMLInputElement>(null);
  const handleAddChat = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const chat = chatRef.current?.value;
    if (!chat) return;
    addChat(chat);
    chatRef.current.value = "";
    console.log(`Chat added: ${chat} at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <form
      onSubmit={(e) => handleAddChat(e)}
      className="flex flex-row items-center h-16 rounded-xl bg-white w-full px-4"
    >
      <div className="flex-grow ml-4">
        <div className="relative w-full">
          <input
            ref={chatRef}
            type="text"
            className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
          />
        </div>
      </div>
      <div className="ml-4">
        <button
          type="submit"
          className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0"
        >
          <span>Send</span>
          <span className="ml-2">
            <svg
              className="w-4 h-4 transform rotate-45 -mt-px"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              ></path>
            </svg>
          </span>
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
