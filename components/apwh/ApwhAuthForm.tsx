"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import ApwhMark from "./ApwhMark";

type AccountRole = "student" | "teacher";

export default function ApwhAuthForm({ mode }: { mode: "join" | "login" }) {
  const router = useRouter();
  const [role, setRole] = useState<AccountRole>("student");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = mode === "join"
        ? { code, name, username, password }
        : { role, identifier: role === "teacher" ? email : username, password };
      const response = await fetch(`/api/apwh/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.push(result.destination ?? `/apwh/classes/${result.classId}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const isTeacherLogin = mode === "login" && role === "teacher";

  return (
    <main className="apwh-auth-page">
      <div className="apwh-auth-atlas" aria-hidden="true"><span /><span /><span /></div>
      <div className="apwh-auth-wrap">
        <div className="apwh-auth-story">
          <ApwhMark />
          <p className="apwh-kicker">YOUR CLASS &middot; YOUR FIELD NOTES &middot; YOUR PROGRESS</p>
          <h1>{mode === "join" ? "Your seat at the table is waiting." : "Welcome back, historian."}</h1>
          <p>
            One calm place for today&apos;s agenda, AP writing, primary sources, live games,
            and the next thing that matters.
          </p>
          <div className="apwh-privacy-note">
            <ShieldCheck size={19} />
            <span><strong>Built for student privacy.</strong> We do not ask students for an email address or student ID.</span>
          </div>
        </div>

        <form className="apwh-auth-card" onSubmit={submit}>
          <p className="apwh-card-number">FIELD ACCESS &middot; 01</p>
          <h2>{mode === "join" ? "Join your class" : "Sign in"}</h2>

          {mode === "login" && (
            <div className="apwh-role-switch" aria-label="Account type">
              <button type="button" className={role === "student" ? "active" : ""} onClick={() => setRole("student")}>
                <UserRound size={15} /> Student
              </button>
              <button type="button" className={role === "teacher" ? "active" : ""} onClick={() => setRole("teacher")}>
                <GraduationCap size={16} /> Teacher
              </button>
            </div>
          )}

          <p className="apwh-auth-help">
            {mode === "join"
              ? "Use a class code once to create your account."
              : isTeacherLogin
                ? "Use your existing Margins teacher account."
                : "No class code needed. Use the username you registered with."}
          </p>

          {mode === "join" && (
            <>
              <label className="apwh-field">
                <span>Class code</span>
                <div><KeyRound size={17} /><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} autoCapitalize="characters" required placeholder="ABC123" /></div>
              </label>
              <label className="apwh-field">
                <span>Your name</span>
                <div><UserRound size={17} /><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required placeholder="Name your teacher knows" autoComplete="name" /></div>
              </label>
            </>
          )}

          {isTeacherLogin ? (
            <label className="apwh-field">
              <span>Email</span>
              <div><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required placeholder="you@school.org" autoComplete="email" /></div>
            </label>
          ) : (
            <label className="apwh-field">
              <span>Username</span>
              <div><UserRound size={17} /><input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} minLength={3} maxLength={30} pattern="[a-z0-9._-]+" required placeholder="first.last" autoComplete="username" /></div>
            </label>
          )}

          <label className="apwh-field">
            <span>Password</span>
            <div><LockKeyhole size={17} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={mode === "join" ? 10 : 1} maxLength={128} required placeholder={mode === "join" ? "10+ characters" : "Your password"} autoComplete={mode === "join" ? "new-password" : "current-password"} /></div>
          </label>

          {error && <p className="apwh-form-error" role="alert">{error}</p>}
          <button className="apwh-primary-button" disabled={loading}>
            {loading ? "Opening the archive..." : mode === "join" ? "Create my account" : "Enter headquarters"}
            {!loading && <ArrowRight size={18} />}
          </button>

          <p className="apwh-auth-switch">
            {mode === "join" ? "Already registered?" : "Student joining for the first time?"}{" "}
            <Link href={mode === "join" ? "/apwh/login" : "/apwh/join"}>{mode === "join" ? "Sign in" : "Join with a code"}</Link>
          </p>
          {isTeacherLogin && <p className="apwh-auth-switch">Need a teacher account? <Link href="/margins/signup?next=/apwh">Create one in Margins</Link></p>}
          <Link href="/apwh" className="apwh-back-link">&larr; Back to AP World Headquarters</Link>
        </form>
      </div>
    </main>
  );
}
