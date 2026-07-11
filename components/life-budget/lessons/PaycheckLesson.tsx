"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#7c3aed";

const CARDS: TermCard[] = [
  {
    term: "Federal Income Tax",
    question: "Why does the government take a percentage of every paycheck before you even see it?",
    definition: "A percentage of your income funds federal programs. The percentage rises as you earn more (progressive brackets). Your employer withholds it automatically based on your W-4.",
    example: "At a $40K salary, federal taxes take roughly $3,500/year — about $292 off every monthly paycheck, before you spend a cent.",
  },
  {
    term: "FICA",
    question: "What's the difference between income tax and that other chunk called FICA?",
    definition: "FICA (Federal Insurance Contributions Act) funds Social Security (6.2%) and Medicare (1.45%). It's separate from income tax and applies to almost every dollar you earn — no exemptions.",
    example: "On a $4,000/month paycheck, FICA removes $306 every month — $3,672/year — no matter what deductions you claim.",
  },
  {
    term: "W-4 Withholding",
    question: "Why do some people get big tax refunds while others owe money in April?",
    definition: "Your W-4 tells your employer how much tax to hold back from each paycheck. Too little withheld → you owe in April. Too much → you overpaid all year and get a refund (but had less cash monthly).",
    example: "Claiming 'Single, 0 allowances' means maximum withholding — likely a refund, but you gave the government an interest-free loan from every paycheck all year.",
  },
  {
    term: "Pre-Tax Benefits",
    question: "How does putting money in a 401k actually lower your tax bill right now?",
    definition: "Pre-tax deductions come off your paycheck before taxes are calculated. You pay income tax on a smaller number, so the government takes less — effectively subsidizing your savings.",
    example: "Contributing $200/month pre-tax to a 401k in the 22% bracket saves $44/month in federal taxes. That $200 contribution costs you only $156 out of pocket.",
  },
  {
    term: "Pay Period",
    question: "Why does bi-weekly pay make your monthly budget math weird?",
    definition: "Bi-weekly (every 2 weeks) gives you 26 paychecks per year, not 24. Two months per year have a 'bonus' third paycheck. Monthly budgeting on a bi-weekly paycheck requires adjustment.",
    example: "Paid $2,000 bi-weekly = $52,000/year. But 2 months you get $6,000 instead of $4,000 — easy to accidentally spend that extra check instead of saving it.",
  },
  {
    term: "Net Income",
    question: "What's the number your entire budget must be built on — and why do people get this wrong?",
    definition: "Net income (take-home pay) is what remains after all taxes and deductions. Your rent, food, and savings must all fit within this number — not your gross salary.",
    example: "Gross: $55,000/year. Net after all deductions: ~$41,000/year = ~$3,417/month. Every module in this simulation is built on your net number, not the gross.",
  },
];

export default function PaycheckLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="6 Terms That Explain Every Paycheck"
      subtitle="Your paycheck is a document full of deductions. Know what each line means before your first direct deposit."
      onReady={onReady}
      ctaLabel="Calculate My Paycheck →"
    />
  );
}
