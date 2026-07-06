import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getBoardsByTeacher } from "@/lib/dashJam";
import MyDashesHub from "@/components/dash/MyDashesHub";

export const metadata: Metadata = {
  title: "My Dashes — Sinon Learning",
  description: "Your saved Dash jamboards — one per class, ready to resume any time.",
};

export default async function MyDashesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/dash/mine");
  if (user.role !== "teacher") redirect("/dash");

  const boards = await getBoardsByTeacher(user.id);
  return (
    <MyDashesHub
      boards={boards.map((b) => ({ id: b.id, code: b.code, title: b.title, createdAt: b.created_at }))}
    />
  );
}
