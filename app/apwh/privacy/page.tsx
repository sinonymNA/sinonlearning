import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleDashed, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import ApwhMark from "@/components/apwh/ApwhMark";

export default function ApwhPrivacyPage() {
  return (
    <main className="apwh-privacy-page">
      <header><ApwhMark /><Link href="/apwh"><ArrowLeft size={15} /> Back to headquarters</Link></header>
      <section className="apwh-privacy-hero">
        <div className="apwh-privacy-seal"><ShieldCheck /></div>
        <p>STUDENT DATA READINESS</p>
        <h1>Privacy is part of the architecture.</h1>
        <span>This page documents the product&apos;s safeguards and the approvals still required before use with real GCPS student information.</span>
      </section>

      <section className="apwh-readiness-banner">
        <TriangleAlert />
        <div><strong>Local testing only until GCPS approval.</strong><p>Use fictional names and test work locally. GCPS requires third-party vendor approval, a FERPA/Data Privacy and Security Addendum, and cybersecurity review for technology that hosts student data.</p></div>
      </section>

      <div className="apwh-privacy-grid">
        <section>
          <p className="apwh-card-number">DATA MINIMIZATION · 01</p>
          <h2>What APWH collects</h2>
          <ul className="apwh-data-list">
            <li><CheckCircle2 /><span><strong>Student display name</strong><small>So the classroom teacher can identify the student.</small></span></li>
            <li><CheckCircle2 /><span><strong>Class-scoped username</strong><small>Used only for authentication inside the student&apos;s class.</small></span></li>
            <li><CheckCircle2 /><span><strong>Hashed password</strong><small>The original password is never stored.</small></span></li>
            <li><CheckCircle2 /><span><strong>Class work and feedback</strong><small>Only where needed to provide Margins learning features.</small></span></li>
          </ul>
          <div className="apwh-do-not-collect"><strong>Not requested by APWH</strong><span>Student email · GCPS student ID · birthdate · address · phone · location · contacts</span></div>
        </section>
        <section>
          <p className="apwh-card-number">ACCESS · 02</p>
          <h2>Who can see records</h2>
          <ul className="apwh-data-list">
            <li><CheckCircle2 /><span><strong>The student</strong><small>Their own account, work, and feedback.</small></span></li>
            <li><CheckCircle2 /><span><strong>The owning teacher</strong><small>Only classes the teacher created and students who joined them.</small></span></li>
            <li><CheckCircle2 /><span><strong>Authorized operations staff</strong><small>Only when necessary for security, support, or a valid legal obligation.</small></span></li>
          </ul>
          <p className="apwh-privacy-copy">Names, writing, scores, and feedback are never intended for public profiles, advertising, data brokerage, or public leaderboards.</p>
        </section>
      </div>

      <section className="apwh-controls-section">
        <div className="apwh-section-heading"><span>ENGINEERING CONTROLS</span><h2>Implemented in this build</h2></div>
        <div className="apwh-control-grid">
          {["No student email requirement", "Salted scrypt password hashes", "Hashed session tokens at rest", "HTTP-only secure cookies", "Seven-day session lifetime", "Persistent login and join rate limits", "Server-side class ownership checks", "Same-origin mutation checks", "Structured request validation", "Minimal non-PII audit events", "Internal-only launch links", "No search engine indexing"].map((item) => <span key={item}><CheckCircle2 />{item}</span>)}
        </div>
      </section>

      <section className="apwh-controls-section pending">
        <div className="apwh-section-heading"><span>LAUNCH GATES</span><h2>Required before real GCPS use</h2></div>
        <div className="apwh-control-grid">
          {["GCPS Third-Party Vendor approval", "Executed FERPA/Data Privacy and Security Addendum", "GCPS cybersecurity questionnaire and review", "District-approved teacher identity method", "Hosting and database vendor review", "Anthropic/AI processing approval", "Parent and student privacy notice", "Retention, export, correction, and deletion policy", "Incident response and breach procedure", "Production penetration and authorization testing"].map((item) => <span key={item}><CircleDashed />{item}</span>)}
        </div>
      </section>

      <section className="apwh-source-notes">
        <p className="apwh-card-number">PRIMARY SOURCES · 03</p>
        <h2>GCPS and Georgia guidance used</h2>
        <div>
          <a href="https://www.gcpsk12.org/about-us/open-records-requests/gcps-procedure-student-records" target="_blank" rel="noreferrer">GCPS Student Records Procedure <ExternalLink /></a>
          <a href="https://www.gcpsk12.org/about-us/divisions-and-teams/strategy-performance-and-accountability/data-governance/data-privacy/are-you-privacy-literate" target="_blank" rel="noreferrer">GCPS: Are You Privacy Literate? <ExternalLink /></a>
          <a href="https://www.gcpsk12.org/programs-and-services/college-and-career-development/academies-and-career-technical-and-agricultural-education/artificial-intelligence-and-computer-science/guidance-for-human-centered-ai-use" target="_blank" rel="noreferrer">GCPS Human-Centered AI Guidance <ExternalLink /></a>
          <a href="https://www.gcpsk12.org/about-us/divisions-and-teams/business-and-finance/bids-purchasing-opportunities/gcps-purchasing-policy-procedure/purchasing-procedure" target="_blank" rel="noreferrer">GCPS Purchasing and Data Hosting Procedure <ExternalLink /></a>
          <a href="https://georgiainsights.gadoe.org/Data-Collections/Pages/Georgia%20Student%20Data%20Privacy%2C%20Accessibility%2C%20and%20Transparency%20Act.aspx" target="_blank" rel="noreferrer">Georgia Student Data Privacy Act Resources <ExternalLink /></a>
        </div>
        <p className="apwh-legal-note">This engineering summary is not legal advice or a claim of FERPA certification. Final authorization belongs to GCPS and its designated data-governance, technology, purchasing, and legal reviewers.</p>
      </section>
    </main>
  );
}
