import SideBar from "../components/SideBar";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAtom, wsAtom, currentRoomIdAtom } from "../store/store";
import DefaultChatPage from "../components/DefaultChatPage";
import Chats from "../components/Chats";

const ChatBox = () => {
  const user = useRecoilValue(userAtom);
  const currentRoomId = useRecoilValue(currentRoomIdAtom);
  const [ws, setWs] = useRecoilState(wsAtom);

  useEffect(() => {
    async function connect() {
      const socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
      setWs(socket);
      if (!ws) return;
      ws.onopen = () => {
        console.log("Connected to server");
      };
    }
    connect();

    return () => {
      if (!ws) return;
      ws.onclose = () => {
        console.log("Disconnected from server");
      };
    };
  }, []);

  console.log("user", user);

  return user ? (
    <div className="flex h-screen antialiased text-gray-800">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        <SideBar />
        {currentRoomId ? <Chats /> : <DefaultChatPage />}
      </div>
    </div>
  ) : (
    <Navigate to="/" />
  );
};

export default ChatBox;
