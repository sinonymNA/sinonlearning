import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenText, Compass, Landmark, PenLine, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassesByStudent } from "@/lib/marginsDb";
import ApwhMark from "@/components/apwh/ApwhMark";

export default async function ApwhHomePage() {
  const user = await getCurrentUser();
  if (user?.role === "teacher") redirect("/apwh/teacher");
  if (user?.role === "student") {
    const classes = await getClassesByStudent(user.id);
    if (classes[0]) redirect(`/apwh/classes/${classes[0].id}`);
  }

  return (
    <main className="apwh-landing">
      <div className="apwh-landing-grid" aria-hidden="true" />
      <nav className="apwh-landing-nav">
        <ApwhMark />
        <div>
          <Link href="/apwh/privacy" className="apwh-nav-text">Privacy</Link>
          <Link href="/apwh/login" className="apwh-nav-button">Sign in</Link>
        </div>
      </nav>

      <section className="apwh-hero">
        <div className="apwh-hero-copy">
          <p className="apwh-kicker">A DAILY FIELD GUIDE FOR AP WORLD HISTORY</p>
          <h1>History is enormous.<br /><em>Your next move</em> is clear.</h1>
          <p className="apwh-hero-lede">
            Today&apos;s agenda, AP writing, primary sources, live challenges, and your
            growing skills—all in one beautiful classroom headquarters.
          </p>
          <div className="apwh-hero-actions">
            <Link href="/apwh/join" className="apwh-primary-button">Join your class <ArrowRight size={18} /></Link>
            <Link href="/apwh/login" className="apwh-secondary-button">Teacher access</Link>
          </div>
          <p className="apwh-hero-privacy"><ShieldCheck size={15} /> No student email or student ID required.</p>
        </div>

        <div className="apwh-hero-object" aria-label="Preview of the Daily Dispatch dashboard">
          <div className="apwh-orbit orbit-one" /><div className="apwh-orbit orbit-two" />
          <div className="apwh-world-disc"><span>1200</span><i>1450</i><b>1750</b></div>
          <article className="apwh-preview-card">
            <p>MONDAY · DAILY DISPATCH</p>
            <h2>How did an ocean become a highway?</h2>
            <div className="apwh-preview-rule" />
            <ol><li>Retrieval warm-up</li><li>Indian Ocean source lab</li><li>Write one causal claim</li></ol>
            <span>BEGIN THE SOURCE LAB →</span>
          </article>
        </div>
      </section>

      <section className="apwh-promise-strip">
        <article><Compass /><span><strong>Know where you are</strong><small>One clear daily path through a global course.</small></span></article>
        <article><PenLine /><span><strong>Write like a historian</strong><small>Build SAQ, DBQ, and LEQ skill one move at a time.</small></span></article>
        <article><Landmark /><span><strong>See the whole story</strong><small>Timelines, sources, maps, and connections—not isolated facts.</small></span></article>
        <article><BookOpenText /><span><strong>Keep your field notes</strong><small>Your practice and feedback travel with you.</small></span></article>
      </section>
    </main>
  );
}
