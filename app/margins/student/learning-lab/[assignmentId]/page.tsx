import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import MarginsHeader from "@/components/margins/MarginsHeader";
import LearningLabStudent from "@/components/margins/LearningLabStudent";

export default async function LearningLabStudentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "student") redirect("/margins/teacher");
  const { assignmentId } = await params;
  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="student" homeHref="/margins/student" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <LearningLabStudent assignmentId={assignmentId} />
      </main>
    </div>
  );
}
