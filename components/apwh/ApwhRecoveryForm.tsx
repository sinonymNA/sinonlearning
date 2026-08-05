"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, KeyRound, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import ApwhMark from "./ApwhMark";

interface ClassOption { id: string; name: string }
type RecoveryRole = "teacher" | "student";

export default function ApwhRecoveryForm() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [role, setRole] = useState<RecoveryRole>("teacher");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [classId, setClassId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/apwh/classes")
      .then((response) => response.json())
      .then((data) => setClasses(data.classes ?? []))
      .catch(() => setClasses([]));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    if (newPassword !== confirmation) {
      setStatus({ kind: "error", message: "The new passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/apwh/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveryKey,
          role,
          identifier,
          classId: role === "student" ? classId : undefined,
          newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setStatus({ kind: "error", message: result.error ?? "Password reset failed." });
        return;
      }
      setStatus({ kind: "success", message: `${result.name}'s password was reset. Existing sessions were signed out.` });
      setIdentifier("");
      setClassId("");
      setNewPassword("");
      setConfirmation("");
    } catch {
      setStatus({ kind: "error", message: "Could not reach the recovery service." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="apwh-recovery-page">
      <header><ApwhMark /><Link href="/apwh/login">Back to sign in</Link></header>
      <div className="apwh-recovery-grid">
        <section className="apwh-recovery-intro">
          <span><ShieldCheck size={21} /></span>
          <p>OWNER-ONLY ACCOUNT RECOVERY</p>
          <h1>Unlock an account without weakening the door.</h1>
          <p>The recovery key stays outside the database and repository. Every successful reset is audited, and all existing sessions for that account are closed.</p>
        </section>

        <form className="apwh-recovery-card" onSubmit={submit}>
          <h2>Reset a password</h2>
          <div className="apwh-role-switch" aria-label="Account type">
            <button type="button" className={role === "teacher" ? "active" : ""} onClick={() => { setRole("teacher"); setIdentifier(""); }}><GraduationCap size={16} /> Teacher</button>
            <button type="button" className={role === "student" ? "active" : ""} onClick={() => { setRole("student"); setIdentifier(""); }}><UserRound size={15} /> Student</button>
          </div>

          <label className="apwh-field">
            <span>Owner recovery key</span>
            <div><KeyRound size={17} /><input type="password" value={recoveryKey} onChange={(event) => setRecoveryKey(event.target.value)} required autoComplete="off" /></div>
          </label>

          {role === "student" && (
            <label className="apwh-field">
              <span>Student class</span>
              <div className="apwh-select-field">
                <select value={classId} onChange={(event) => setClassId(event.target.value)} required>
                  <option value="">Choose a class</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </label>
          )}

          <label className="apwh-field">
            <span>{role === "teacher" ? "Teacher email or exact name" : "Student username"}</span>
            <div><UserRound size={17} /><input type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoComplete="off" /></div>
          </label>
          <label className="apwh-field">
            <span>New password</span>
            <div><LockKeyhole size={17} /><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} maxLength={128} required autoComplete="new-password" /></div>
          </label>
          <label className="apwh-field">
            <span>Confirm new password</span>
            <div><LockKeyhole size={17} /><input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required autoComplete="new-password" /></div>
          </label>

          {status && <p className={status.kind === "success" ? "apwh-form-success" : "apwh-form-error"} role="status">{status.message}</p>}
          <button className="apwh-primary-button" disabled={loading}>{loading ? "Resetting..." : "Reset password"}</button>
        </form>
      </div>
    </main>
  );
}
