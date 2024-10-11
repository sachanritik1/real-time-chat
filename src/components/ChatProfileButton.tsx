import { useRecoilValue, useRecoilState } from "recoil";
import { SupportedIncomingMessage } from "../constants";
import { currentRoomIdAtom, userAtom, wsAtom } from "../store/store";

const ChatProfileButton = ({ roomId }: { roomId: string }) => {
  const user = useRecoilValue(userAtom);
  const ws = useRecoilValue(wsAtom);
  const [currentRoomId, setCurrentRoomId] = useRecoilState(currentRoomIdAtom);
  const joinRoom = () => {
    const data = {
      type: SupportedIncomingMessage.JoinRoom,
      payload: {
        roomId: roomId,
        ...user,
      },
    };
    if (!ws) return;
    ws.send(JSON.stringify(data));
  };
  const handleJoinRoom = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.disabled = true;
    console.log(`Joining room ${roomId}`);
    joinRoom();
    setCurrentRoomId(roomId);
    e.currentTarget.disabled = false;
  };
  return (
    <button
      onClick={(e) => handleJoinRoom(e)}
      className={
        "flex flex-row items-center hover:bg-gray-100 rounded-xl p-2" +
        (currentRoomId === roomId ? " bg-gray-100" : "")
      }
    >
      <div className="flex items-center justify-center h-8 w-8 bg-indigo-200 rounded-full">
        {roomId?.[0]}
      </div>
      <div className="ml-2 text-sm font-semibold">{roomId}</div>
    </button>
  );
};

export default ChatProfileButton;
