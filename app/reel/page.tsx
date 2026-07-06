import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getReelProjectsByTeacher } from "@/lib/reelDb";
import ReelHub from "@/components/reel/ReelHub";

export const metadata: Metadata = {
  title: "Reel — Sinon Learning",
  description:
    "Reel turns a short script into a clean animated explainer video — KORA drafts the beats, you record the voice-over.",
};

export default async function ReelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/reel");
  if (user.role !== "teacher") redirect("/margins/student");

  const projects = await getReelProjectsByTeacher(user.id);
  return <ReelHub name={user.name} projects={projects} />;
}
