"use client";

import { useRef } from "react";
import { useRecoilState } from "recoil";
import { userAtom } from "../store/store";
import { useRouter } from "next/navigation";

const SignIn = () => {
  const userIdRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useRecoilState(userAtom);

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const userId = userIdRef.current?.value;
    const name = nameRef.current?.value;
    if (!userId || !name) return;
    setUser({ userId, name });
  };

  if (user) {
    router.push("/home");
  }

  return (
    <div className="flex flex-col justify-center items-center mx-auto h-screen">
      <h1 className="my-4 text-3xl font-bol -mt-20">Welcome!</h1>
      <div className="bg-slate-300 p-4 rounded-lg">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            ref={userIdRef}
            className="px-4 py-1 rounded-md bg-neutral-200"
            type="text"
            placeholder="User Id"
          />
          <input
            ref={nameRef}
            className="px-4 py-1 rounded-md bg-neutral-200"
            type="text"
            placeholder="Name"
          />
          <button
            className="px-4 py-1 rounded-md text-white bg-blue-500 hover:bg-blue-600"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
