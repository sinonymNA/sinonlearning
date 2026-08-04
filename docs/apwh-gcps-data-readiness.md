# APWH Headquarters: GCPS Student Data Readiness

Last reviewed: August 4, 2026

This document is an engineering readiness record, not legal advice or a claim of
FERPA certification. APWH Headquarters may be tested locally with fictional data.
Use with real Gwinnett County Public Schools student information remains subject
to GCPS approval.

## Controlling GCPS requirements

GCPS refers to **Gwinnett County Public Schools**. It does not refer to Google
Classroom Platform Services.

GCPS's published procedures establish that:

- Parents and eligible students have rights to inspect, obtain electronic copies
  of, seek amendment of, and control disclosures from education records.
- Access must be restricted to school officials with a legitimate educational
  interest.
- Instructional resources must pass student-data-privacy and architectural review
  by GCPS Data Governance and Information Management Technology.
- AI tools must use the GCPS Third-Party Vendor Approval process. Staff must not
  enter student personally identifiable information into AI tools.
- Technology expenditures involving third-party hosting of GCPS student or
  employee data require a FERPA and Data Privacy and Security Addendum and the
  Third-Party Cybersecurity Questionnaire, regardless of purchase amount.

Primary sources:

- [GCPS Student Records Procedure](https://www.gcpsk12.org/about-us/open-records-requests/gcps-procedure-student-records)
- [GCPS: Are You Privacy Literate?](https://www.gcpsk12.org/about-us/divisions-and-teams/strategy-performance-and-accountability/data-governance/data-privacy/are-you-privacy-literate)
- [GCPS Human-Centered AI Guidance](https://www.gcpsk12.org/programs-and-services/college-and-career-development/academies-and-career-technical-and-agricultural-education/artificial-intelligence-and-computer-science/guidance-for-human-centered-ai-use)
- [GCPS Instructional Resources Selection](https://www.gcpsk12.org/schools/enrichment-and-support-programs/instructional-resources-and-support/instructional-resources-selection)
- [GCPS Purchasing Procedure](https://www.gcpsk12.org/about-us/divisions-and-teams/business-and-finance/bids-purchasing-opportunities/gcps-purchasing-policy-procedure/purchasing-procedure)
- [Georgia Student Data Privacy Act resources](https://georgiainsights.gadoe.org/Data-Collections/Pages/Georgia%20Student%20Data%20Privacy%2C%20Accessibility%2C%20and%20Transparency%20Act.aspx)

## Data minimized in APWH

Student onboarding requests only:

- class join code;
- display name;
- class-scoped username; and
- password.

APWH does not request a student email, GCPS student number, birthdate, address,
phone number, location, or contacts. A random non-routable alias satisfies the
legacy Margins email column without representing a real student email address.

Student writing, feedback, assignment status, and mastery information remain
education records even when direct identifiers are removed from an AI prompt.
They must be treated as protected throughout storage, processing, backups, logs,
and deletion.

## Controls implemented

- salted scrypt password hashing;
- session tokens hashed before database storage;
- HTTP-only, secure-in-production, SameSite cookies;
- seven-day session expiration;
- persistent database-backed rate limits for APWH login and join attempts;
- class-scoped usernames;
- server-side teacher ownership and student membership authorization;
- same-origin checks on APWH mutations;
- Zod request validation;
- internal-route allowlisting for teacher-created dashboard actions;
- audit events containing action metadata rather than student work;
- student-facing routes excluded from search indexing; and
- no public student profiles or leaderboards in APWH.

## AI processing boundary

Margins currently uses the Anthropic API for some feedback and evaluation flows.
Pseudonymization reduces risk but does not make student writing non-sensitive or
remove the need for GCPS vendor approval.

Anthropic states that standard API inputs and outputs are generally deleted from
its backend within 30 days, subject to exceptions. Zero data retention is a
separate arrangement available to approved customers and has product limitations.

- [Anthropic API retention](https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data)
- [Anthropic zero-data-retention scope](https://privacy.anthropic.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to)

Before GCPS use, the production AI boundary should be documented and tested to
ensure prompts exclude student names, usernames, email aliases, class names,
teacher names, school names, and other direct identifiers. GCPS must approve the
provider and use case.

## Required launch gates

- [ ] GCPS Third-Party Vendor approval
- [ ] FERPA and Data Privacy and Security Addendum executed where required
- [ ] Third-Party Cybersecurity Questionnaire and architecture review
- [ ] Approved hosting, database, backup, and AI subprocessors
- [ ] District-approved teacher identity and account provisioning
- [ ] Parent/student notice describing collection, use, disclosure, and rights
- [ ] Operational export, correction, and amendment workflow
- [ ] Written record-retention and deletion schedule
- [ ] Backup deletion behavior validated
- [ ] Incident response and breach-notification procedure
- [ ] Production authorization, dependency, and penetration testing
- [ ] Human review rules for AI feedback and any official score

## Claims that must not be made

Do not state that local deployment automatically makes Margins/APWH FERPA
compliant or exempts it from GCPS review. Do not state that Anthropic immediately
deletes every request unless a qualifying zero-data-retention agreement and the
exact API configuration have been verified. Do not state that parent access,
encryption at rest, SSO, or teacher-finalized per-rubric grading exists until each
feature is implemented and tested in the deployed environment.
