import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getReelProjectById } from "@/lib/reelDb";
import ReelEditor from "@/components/reel/ReelEditor";

export default async function ReelEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/margins/login?next=/reel/${projectId}`);
  if (user.role !== "teacher") redirect("/margins/student");

  const project = await getReelProjectById(projectId);
  if (!project || project.teacher_id !== user.id) notFound();

  return <ReelEditor project={project} />;
}
