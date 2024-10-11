import ChatProfileButton from "./ChatProfileButton";
import { useRecoilValue } from "recoil";
import { roomIdsAtom } from "../store/store";

const ProfileBox = () => {
  const roomIds = useRecoilValue(roomIdsAtom);
  return (
    <div>
      <div className="flex flex-col mt-8">
        <div className="flex flex-row items-center justify-between text-xs">
          <span className="font-bold">Active Rooms</span>
          <span className="flex items-center justify-center bg-gray-300 h-4 w-4 rounded-full">
            {roomIds.length}
          </span>
        </div>
        <div className="flex flex-col space-y-1 mt-4 -mx-2 h-80 overflow-y-scroll">
          {roomIds.length === 0 && (
            <div className="flex flex-row items-center text-sm p-2">
              No Rooms Active
            </div>
          )}
          {roomIds.map((roomId) => (
            <ChatProfileButton key={roomId} roomId={roomId} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileBox;
