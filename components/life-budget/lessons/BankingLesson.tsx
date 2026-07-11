"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#0369a1";

const CARDS: TermCard[] = [
  {
    term: "APY",
    question: "What's the number that tells you what you actually earn on a savings account?",
    definition: "APY (Annual Percentage Yield) is the real annual rate earned on deposits, including the effect of compounding. It's the number that matters for savings — not the marketing rate.",
    example: "Regular savings at 0.01% APY: $10,000 earns $1/year. High-yield savings at 4.75% APY: same $10,000 earns $475/year. Same money. Different bank. $474 difference.",
  },
  {
    term: "High-Yield Savings Account",
    question: "Why doesn't everyone use a high-yield savings account if it's so much better?",
    definition: "HYSAs offer dramatically higher interest rates than traditional savings accounts — often 40–100× more — with the same FDIC deposit insurance protection. Most people just never switch banks.",
    example: "$5,000 emergency fund: traditional savings earns $0.50/year. HYSA earns $237/year. Over 5 years: $1,185 vs. $2.50. That's free money for choosing the right bank.",
  },
  {
    term: "FDIC Insurance",
    question: "What actually happens to your money if a bank fails?",
    definition: "The FDIC (Federal Deposit Insurance Corporation) insures bank deposits up to $250,000 per depositor per institution. If the bank fails, the government makes you whole — your money is safe.",
    example: "Your $8,000 checking account at any FDIC-insured bank is fully protected. The bank could fail overnight and you'd receive every dollar back within days.",
  },
  {
    term: "Overdraft",
    question: "What actually happens when you spend $1 more than you have in your account?",
    definition: "Overdraft occurs when a transaction exceeds your available balance. Banks either decline the transaction or cover it and charge an overdraft fee — typically $25–$35 per occurrence.",
    example: "Spending $12 on coffee when you have $5 in your account: the bank covers it and charges a $35 overdraft fee. That $12 coffee cost you $47.",
  },
  {
    term: "Checking vs. Savings",
    question: "Why do you need two separate bank accounts instead of one?",
    definition: "Checking accounts are built for daily spending — no transaction limits, debit card linked, easy access. Savings accounts are for reserves — money you shouldn't spend day-to-day.",
    example: "Keep $500–$1,000 in checking for bills and daily spending. Keep your $4,000 emergency fund in a HYSA — separate and harder to accidentally spend.",
  },
  {
    term: "ACH vs. Wire Transfer",
    question: "What's the difference between 'it'll arrive in 3 business days' and instant?",
    definition: "ACH (Automated Clearing House) is a batch system used for direct deposit and bill pay — cheap or free but takes 1–3 days. Wire transfers are near-instant but cost $15–$45 to send.",
    example: "Paying rent via ACH bill pay: free, arrives next day. Sending $10,000 to close on a car purchase: wire transfer, $25 fee, same day. Use each for the right situation.",
  },
];

export default function BankingLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="6 Banking Terms Worth Real Money"
      subtitle="The 'right' bank can earn you hundreds extra per year. These terms explain why — and how to choose."
      onReady={onReady}
      ctaLabel="Set Up My Banking →"
    />
  );
}
