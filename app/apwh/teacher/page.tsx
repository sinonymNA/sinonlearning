import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenCheck, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassesByTeacher } from "@/lib/marginsDb";
import { ensureApwhProfile } from "@/lib/apwhDb";
import ApwhHeader from "@/components/apwh/ApwhHeader";

export default async function ApwhTeacherPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/apwh/teacher");
  if (user.role !== "teacher") redirect("/apwh");
  const classes = await getClassesByTeacher(user.id);
  const profiles = await Promise.all(classes.map((item) => ensureApwhProfile(item.id)));

  return (
    <div className="apwh-dashboard-page">
      <ApwhHeader name={user.name} role="teacher" />
      <main className="apwh-teacher-home">
        <header className="apwh-teacher-hero">
          <div><span>TEACHER COMMAND CENTER</span><h1>Good morning, {user.name.split(" ")[0]}.</h1><p>Shape the day once. Every student sees the route.</p></div>
          <Link href="/margins/teacher" className="apwh-secondary-button"><Plus size={16} /> Manage classes in Margins</Link>
        </header>
        <section className="apwh-teacher-note"><ShieldCheck /><div><strong>Classroom pilot ready</strong><p>Privacy-minimized student accounts, class-scoped access, and the APWH audit trail are active. Follow the conditions provided by your county contact.</p></div><Link href="/apwh/privacy">Read privacy notes</Link></section>
        <section className="apwh-teacher-classes">
          <div className="apwh-section-heading"><span>YOUR CLASSROOMS</span><h2>Choose a dispatch to edit.</h2></div>
          {classes.length ? <div className="apwh-class-cards">{classes.map((cls, index) => (
            <article key={cls.id}>
              <div className="apwh-class-card-map" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div><small>{profiles[index].current_unit}</small><h3>{cls.name}</h3><p>{profiles[index].period_label || "AP World History"} · Join code <strong>{cls.join_code}</strong></p></div>
              <footer><Link href={`/apwh/teacher/classes/${cls.id}`}><BookOpenCheck size={16} /> Edit dispatch</Link><Link href={`/apwh/classes/${cls.id}`}>Preview <ArrowRight size={15} /></Link></footer>
            </article>
          ))}</div> : <div className="apwh-no-classes"><UsersRound /><h2>Create your first class in Margins.</h2><p>APWH uses the same safe roster and assignments—no duplicate student records.</p><Link href="/margins/teacher" className="apwh-primary-button">Open Margins <ArrowRight size={17} /></Link></div>}
        </section>
      </main>
    </div>
  );
}
