import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById } from "@/lib/marginsDb";
import { ensureApwhProfile, getDispatch } from "@/lib/apwhDb";
import { easternDateString } from "@/lib/apwhDate";
import ApwhHeader from "@/components/apwh/ApwhHeader";
import DispatchEditor from "@/components/apwh/DispatchEditor";

export default async function ApwhDispatchEditorPage({ params }: { params: Promise<{ classId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/apwh/teacher");
  if (user.role !== "teacher") redirect("/apwh");
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls || cls.teacher_id !== user.id) notFound();
  const today = easternDateString();
  const [profile, dispatch] = await Promise.all([ensureApwhProfile(classId), getDispatch(classId, today)]);
  return <div className="apwh-dashboard-page"><ApwhHeader name={user.name} role="teacher" /><main className="apwh-editor-page"><p className="apwh-editor-class">{cls.name} · {profile.period_label || "AP World History"}</p><DispatchEditor classId={classId} profile={profile} dispatch={dispatch} today={today} /></main></div>;
}
