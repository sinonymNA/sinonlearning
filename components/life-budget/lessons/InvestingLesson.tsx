"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#d97706";

const CARDS: TermCard[] = [
  {
    term: "Compound Interest",
    question: "Why is starting to invest at 22 worth more than starting at 32 with twice as much money?",
    definition: "Compound interest is earning returns on your returns — your balance grows exponentially over time because gains become part of the principal that earns future gains. Time is the key variable.",
    example: "$200/month from age 22 to 65 at 7% average: ~$525,000. Same $200/month from 32 to 65: ~$244,000. The 10-year head start = $281,000 more without contributing a single extra dollar.",
  },
  {
    term: "401(k)",
    question: "Why does your employer basically offer you free money — and why do people not take it?",
    definition: "A 401(k) is a workplace retirement account funded with pre-tax dollars. Many employers match contributions up to a percentage of salary — that match is an instant guaranteed return on those dollars.",
    example: "4% employer match on a $50,000 salary = $2,000 free/year. Not contributing enough to capture the match means leaving $2,000 on the table — annually, every year you work there.",
  },
  {
    term: "Roth IRA",
    question: "Why would you ever pay taxes now instead of later?",
    definition: "A Roth IRA uses after-tax dollars. In exchange, all growth and withdrawals in retirement are completely tax-free. Best for younger workers in lower tax brackets now who expect to be in higher brackets later.",
    example: "Contribute $500/month in your 20s. At 65 you might withdraw $1M+ — and pay $0 in taxes on it, because you paid taxes on the $240K you originally put in.",
  },
  {
    term: "Index Fund",
    question: "Why do most professional fund managers lose to a simple index fund over 20+ years?",
    definition: "An index fund holds a proportional slice of every company in a market index (like the S&P 500). Low fees, automatic diversification, and historically outperforms most actively-managed funds over long periods.",
    example: "S&P 500 index fund average: ~10.5%/year since 1957. Average actively-managed fund: ~7.5%/year. Over 30 years at $200/month, that 3% gap means roughly $300,000 less in your account.",
  },
  {
    term: "Employer Match",
    question: "What's the single best guaranteed return available in any investment?",
    definition: "An employer 401(k) match is when your company contributes money to your retirement proportional to what you put in — typically 50%–100% match up to 3–6% of salary. It's an immediate 50–100% return.",
    example: "You contribute $3,000 (6% of $50K salary), employer matches $1,500 (50% match) → you have $4,500 instead of $3,000 before your investments earn a single cent.",
  },
  {
    term: "Target Date Fund",
    question: "What's the simplest long-term investing strategy — and why do advisors recommend it so often?",
    definition: "A target date fund (like '2065 Fund') automatically adjusts its investment mix from aggressive to conservative as you approach the target year. Set it once and it manages itself.",
    example: "Invest in a 2065 Fund and never touch it. The fund shifts from ~90% stocks at 22 to ~40% stocks at 65 automatically, reducing risk as you approach retirement without any action from you.",
  },
  {
    term: "Dollar-Cost Averaging",
    question: "Why is investing the same amount every month better than trying to time the market?",
    definition: "Dollar-cost averaging means investing a fixed amount on a regular schedule regardless of market conditions. You automatically buy more shares when prices are low and fewer when high — averaging out your cost.",
    example: "Invest $200/month whether the S&P is up 5% or down 10%. Over 30 years this approach outperforms most attempts to 'wait for the right moment' because timing the market consistently is nearly impossible.",
  },
  {
    term: "Diversification",
    question: "Why is putting all your money in one company's stock dangerous, even if you believe in it?",
    definition: "Diversification means spreading investments across many assets so no single failure can sink your entire portfolio. Index funds provide automatic diversification across hundreds of companies.",
    example: "$10,000 in one company → company goes bankrupt → $0. $10,000 in an S&P 500 index fund → even if 50 companies fail, the other 450 cushion the loss significantly.",
  },
];

export default function InvestingLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="8 Investing Terms Worth $281,000 to You"
      subtitle="The 10-year head start you saw in the simulator is real. These terms explain how to capture it."
      onReady={onReady}
      ctaLabel="Start My Investment Plan →"
    />
  );
}
