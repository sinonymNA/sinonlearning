"use client";

 

import { useRouter } from "next/navigation";
import JoinForm from "./JoinForm";
import { api, saveCreds } from "./useRoom";

export default function JoinPage({ initialCode }: { initialCode: string }) {
  const router = useRouter();
  return (
    <JoinForm initialCode={initialCode} onJoin={async (code, nickname, avatar) => {
      const d = await api("/api/arcade", { type: "join", code, nickname, avatar });
      saveCreds(code, { playerId: d.playerId, token: d.token, nickname: d.nickname, avatar: d.avatar });
      router.push(`/arcade/room/${code}`);
    }} />
  );
}
