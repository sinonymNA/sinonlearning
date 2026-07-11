"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#059669";

const CARDS: TermCard[] = [
  {
    term: "Premium",
    question: "Why do you pay insurance every month even when absolutely nothing goes wrong?",
    definition: "A premium is the monthly (or annual) amount you pay to maintain insurance coverage. You pay it regardless of whether you file a claim — it's the cost of having protection available.",
    example: "Health insurance premium: $180/month = $2,160/year paid before a single doctor's visit or medical bill. That's the price of being covered if something does go wrong.",
  },
  {
    term: "Deductible",
    question: "What does 'you pay the first $1,500' mean in practice?",
    definition: "Your deductible is the amount you pay out-of-pocket for covered services before insurance starts contributing. Higher deductible = lower monthly premium (but more personal risk per incident).",
    example: "Broken arm = $2,800 bill. $1,500 deductible → you pay $1,500 first, insurance pays $1,300. If you never break your arm this year, you paid $1,500 deductible for protection you didn't need — but you had it.",
  },
  {
    term: "Copay",
    question: "What's the small flat fee you hand over at every doctor's office visit?",
    definition: "A copay is a fixed dollar amount you pay for a specific covered service (doctor visit, specialist visit, prescription) — typically applies after your deductible is met.",
    example: "$25 copay for a primary care visit. $50 copay for a specialist. $10 copay for a generic prescription. Each visit costs that flat fee, regardless of what care you receive.",
  },
  {
    term: "Coinsurance",
    question: "What does '80/20' mean after you've already paid your deductible?",
    definition: "After meeting your deductible, you and your insurance split the remaining costs at a fixed ratio — often 80/20 (insurance pays 80%, you pay 20%) — until you hit your out-of-pocket maximum.",
    example: "$10,000 surgery after your deductible is met: insurance pays $8,000, you pay $2,000 in coinsurance. This continues until you've hit your OOP max for the year.",
  },
  {
    term: "Out-of-Pocket Maximum",
    question: "When does insurance actually start paying 100% of everything?",
    definition: "The out-of-pocket maximum is the most you'll ever pay in a year for covered services. Once you hit it — through deductibles, copays, and coinsurance combined — insurance covers 100% for the rest of the year.",
    example: "OOP max: $7,500. After a major surgery where your costs total $7,500, your next $30,000 hospital bill for that year = $0 to you. The cap protects you from financial ruin.",
  },
  {
    term: "Bronze / Silver / Gold Tiers",
    question: "How do you pick a health plan tier when you're 22 and feel invincible?",
    definition: "Marketplace health plans come in metal tiers. Bronze = lowest premium, highest deductible (less protection, lower monthly cost). Gold = highest premium, lowest out-of-pocket (more protection, higher monthly cost).",
    example: "Bronze: $150/month, $7,000 deductible. Gold: $280/month, $1,500 deductible. A major surgery costs nearly the same out-of-pocket on either plan — but bronze saves $1,560/year in premiums if you stay healthy.",
  },
  {
    term: "Renters Insurance",
    question: "Why does a $15/month policy matter when nothing bad has ever happened to you?",
    definition: "Renters insurance covers your personal belongings against theft, fire, and water damage, plus personal liability if someone is injured in your unit. Landlords often require it — and it's remarkably cheap.",
    example: "Laptop ($1,200) stolen from your apartment. Without renters insurance: you replace it out of pocket. With it: file a claim → get $950 back after a $250 deductible. $15/month well spent.",
  },
];

export default function InsuranceLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="7 Insurance Terms That Could Save You Thousands"
      subtitle="Health insurance has its own language. Understand these 7 terms and you'll never be caught off guard by a medical bill again."
      onReady={onReady}
      ctaLabel="Choose My Insurance →"
    />
  );
}
