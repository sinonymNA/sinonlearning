"use client";

 

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function QuickJoin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.length >= 4) router.push(`/arcade/join?code=${code}`); }}>
      <input className="ar-input" style={{ textTransform: "uppercase", letterSpacing: ".25em", textAlign: "center", fontSize: "1.5rem", maxWidth: 220 }} value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" aria-label="Room code" autoComplete="off" />
      <button className="ar-btn coral" disabled={code.length < 4}>Join</button>
    </form>
  );
}
