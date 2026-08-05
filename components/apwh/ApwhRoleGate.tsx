"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, UserRound } from "lucide-react";

export default function ApwhRoleGate() {
  return (
    <div className="apwh-role-gate" role="dialog" aria-modal="true" aria-labelledby="apwh-role-title">
      <div className="apwh-role-gate-backdrop" />
      <section className="apwh-role-gate-card">
        <p>AP WORLD HEADQUARTERS</p>
        <h2 id="apwh-role-title">How are you entering today?</h2>
        <div className="apwh-role-gate-options">
          <Link href="/apwh/join">
            <span><UserRound size={25} /></span>
            <div><strong>Student</strong><small>Create an account and choose your class.</small></div>
            <ArrowRight size={18} />
          </Link>
          <Link href="/apwh/login?role=teacher">
            <span><GraduationCap size={27} /></span>
            <div><strong>Teacher</strong><small>Open your classes and daily dispatch.</small></div>
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="apwh-role-gate-returning">
          Already have a student account? <Link href="/apwh/login">Sign in without a class code</Link>
        </div>
      </section>
    </div>
  );
}
