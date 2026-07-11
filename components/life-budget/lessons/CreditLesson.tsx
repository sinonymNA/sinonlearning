"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#dc2626";

const CARDS: TermCard[] = [
  {
    term: "APR",
    question: "Why does 24.99% APR sound like just a number until it destroys your budget?",
    definition: "APR (Annual Percentage Rate) is the yearly cost of borrowing. On a credit card, if you carry a balance month to month, you're charged approximately APR ÷ 12 each month on whatever you owe.",
    example: "$1,000 balance at 24.99% APR carried for 12 months = ~$138 in interest. You paid $1,138 for $1,000 worth of purchases. And that's if you make consistent payments.",
  },
  {
    term: "Minimum Payment",
    question: "Why do credit card companies only ask for 2% of your balance each month?",
    definition: "The minimum payment (often 2% of balance or $25, whichever is higher) keeps your account current but barely touches the principal. The remaining balance accrues high-interest charges every month.",
    example: "$3,000 balance, minimum payments only: 141 months to pay off, $1,620 in interest. Paying flat $150/month: 23 months, $360 in interest. Same debt. $1,260 difference.",
  },
  {
    term: "Credit Score",
    question: "What's actually in a credit score — and why does it matter when you're 22?",
    definition: "A 3-digit number (300–850) summarizing your credit history: payment history (35%), amounts owed (30%), length of history (15%), credit mix (10%), new inquiries (10%). Affects loans, rentals, and sometimes employment.",
    example: "750 score → car loan at 5% → $276/month payment. 580 score → same loan at 18% → $355/month. That $79/month difference = $4,740 more paid over 5 years.",
  },
  {
    term: "Credit Utilization",
    question: "Why should you never max out a credit card, even if you plan to pay it off in full?",
    definition: "Utilization is the percentage of your available credit limit you're currently using. The scoring formula penalizes high utilization — even if you pay in full every month, the statement balance gets reported.",
    example: "$500 limit, $450 balance = 90% utilization → significant score penalty. Keep utilization under 30% ($150 balance) for the best scoring outcome.",
  },
  {
    term: "Hard vs. Soft Inquiry",
    question: "Does checking your own credit score hurt it?",
    definition: "A hard inquiry (a lender pulling your credit to evaluate an application) temporarily lowers your score by ~5 points. A soft inquiry (you checking your own score, employer checks) does not affect your score at all.",
    example: "Applying for 4 credit cards in one month = 4 hard inquiries = ~20-point score drop that takes 12 months to fully recover. Space out credit applications.",
  },
  {
    term: "Secured Credit Card",
    question: "How do you build a credit history when you have no credit history to start with?",
    definition: "A secured card requires a cash deposit (usually $200–$500) that becomes your credit limit. Use it for small recurring purchases, pay the balance in full monthly, and you build a positive credit history fast.",
    example: "$200 deposit → $200 limit → buy gas ($40/month) → pay in full monthly → 12 months of on-time payments builds a solid starting credit file.",
  },
  {
    term: "Student Loan Interest",
    question: "What's the true total cost of your student loan after 10 years of payments?",
    definition: "Federal loans accrue interest from disbursement (or after your grace period). The standard 10-year repayment plan means you pay significantly more than the original balance in total.",
    example: "$28,000 loan at 6.5% on 10-year standard plan: $316/month, total paid = $37,900. You paid $9,900 in interest on top of the amount you actually borrowed.",
  },
  {
    term: "Credit Mix",
    question: "Why does having different types of debt (not just credit cards) help your score?",
    definition: "Credit mix (15% of your FICO score) rewards having a variety of account types — revolving credit (credit cards) plus installment loans (car, student). Lenders like to see you can handle both responsibly.",
    example: "Having one credit card + a student loan = better credit mix than having 3 credit cards alone — even if the total balances are the same.",
  },
];

export default function CreditLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="8 Credit Terms That Could Cost You Thousands"
      subtitle="These terms govern loans, apartments, and car payments for the next decade. The minimum payment alone can cost you 9 extra years."
      onReady={onReady}
      ctaLabel="Document My Credit →"
    />
  );
}
