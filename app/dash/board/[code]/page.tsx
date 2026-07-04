"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import JamboardView from "@/components/dash/JamboardView";

function getStudentName(code: string): string | null {
  return sessionStorage.getItem(`dash:jam:${code}:name`);
}

export default function JamboardBoardPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!code) return;
    const saved = getStudentName(code);
    if (!saved) {
      router.replace(`/dash/join?code=${code}`);
      return;
    }
    setName(saved);
    setChecked(true);
  }, [code, router]);

  if (!checked || !name) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <Loader2 size={24} className="animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Dash Jamboard</p>
          <h1 className="mt-1 font-display text-xl text-navy-900">
            Code: <span className="tracking-widest text-green-700">{code}</span>
          </h1>
        </div>
        <div className="h-[calc(100vh-160px)]">
          <JamboardView code={code} isHost={false} authorName={name} />
        </div>
      </div>
    </div>
  );
}
