"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#0891b2";

const CARDS: TermCard[] = [
  {
    term: "30% Rule",
    question: "Why do landlords and banks use 30% as the magic housing number?",
    definition: "A widely-used guideline: spend no more than 30% of your gross monthly income on rent. Exceed it and your other necessities — food, transportation, savings — get squeezed.",
    example: "Earning $3,500/month net? Max rent by the 30% rule (applied to net): $1,050/month. In many cities this limits you to roommates or suburbs.",
  },
  {
    term: "Lease Agreement",
    question: "What's the difference between renting month-to-month and signing a lease?",
    definition: "A lease is a legal contract committing you to a specific term (typically 12 months) and monthly amount. Breaking it early almost always costs 1–2 months of rent.",
    example: "12-month lease at $1,200/month = $14,400 committed. Leave after month 4? Expect a $1,200–$2,400 early termination penalty on top of any rent already owed.",
  },
  {
    term: "Security Deposit",
    question: "Where does your security deposit go — and do you actually get it back?",
    definition: "A cash deposit (usually 1–2 months rent) held by your landlord to cover damage beyond normal wear and tear. Returned within 30 days of move-out if the unit is left in good condition.",
    example: "$1,400/month apartment → $1,400–$2,800 security deposit due at signing, on top of first month's rent. That's $2,800–$4,200 needed just to move in.",
  },
  {
    term: "Utilities",
    question: "What does 'utilities not included' actually add to your monthly cost?",
    definition: "Utilities are monthly service costs: electricity, gas, water, internet, and trash. Many rentals do not include them. They must be budgeted on top of rent.",
    example: "Average 1-bedroom: electricity $80/mo, internet $60/mo, gas $40/mo = $180/month extra. 'Utilities included' saves that $180 and simplifies your budget.",
  },
  {
    term: "Renters Insurance",
    question: "Why would you pay for insurance when you're just renting?",
    definition: "Renters insurance covers your personal belongings (theft, fire, water damage) and personal liability if someone is injured in your unit. Most landlords require it. It's usually very cheap.",
    example: "~$15/month insures $15,000 in belongings and provides $100K in liability coverage. Without it, one apartment fire means your laptop, furniture, and clothes are gone — no check.",
  },
  {
    term: "Credit Check for Renting",
    question: "Why does your credit score affect whether you can rent an apartment?",
    definition: "Most landlords pull your credit to verify you pay obligations on time. Low scores or no credit history can mean rejection — or require a larger upfront deposit to offset their risk.",
    example: "A 580 credit score may require a 2-month deposit ($2,800 upfront instead of $1,400) — or disqualify you from the unit entirely, forcing you into higher-cost options.",
  },
  {
    term: "Income Requirement",
    question: "How do landlords actually decide whether you can afford their unit?",
    definition: "Most landlords require proof that your gross income is 2.5–3× the monthly rent. They typically ask for recent pay stubs or an offer letter to verify this.",
    example: "$1,400/month rent → landlord requires $3,500–$4,200/month gross income ($42K–$50K annual salary). Below that, you'll need a co-signer or a different unit.",
  },
];

export default function HousingLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="7 Terms Before You Sign a Lease"
      subtitle="Housing is your biggest monthly expense. Know these before you hand over a deposit."
      onReady={onReady}
      ctaLabel="Find My Place →"
    />
  );
}
