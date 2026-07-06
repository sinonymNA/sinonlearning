import type { Metadata } from "next";
import Dash from "@/components/dash/Dash";
import { getCurrentUser } from "@/lib/marginsAuth";

export const metadata: Metadata = {
  title: "Dash — Sinon Learning",
  description:
    "Dash is a free, all-in-one front-of-room display with a live agenda, timer, student randomizer, polls, exit tickets, and ambient YouTube backgrounds.",
};

export default async function DashPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  return <Dash isTeacher={user?.role === "teacher"} resumeBoardId={params.board} />;
}
