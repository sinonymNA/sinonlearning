"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";

const ACCENT = "#2563eb";

const INK  = "#0f172a";
const MUTED = "#64748b";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    narrative: (
      <p>
        Maya got the email on a Tuesday afternoon:{" "}
        <Em>We&apos;d like to offer you the position of Junior Graphic Designer at $52,000/year.</Em>{" "}
        She screamed. Then she called her dad. His first question surprised her: &ldquo;Is that a good number?&rdquo;
        She had no idea. She&apos;d never had a reason to look.
      </p>
    ),
    term: {
      name: "BLS Median Wage",
      definition:
        "The Bureau of Labor Statistics tracks the median annual wage for every occupation in the US — the exact midpoint where half of all workers earn more and half earn less. For graphic designers, it's $58,910. Maya's offer of $52,000 was 12% below that median.",
      impact:
        "Entry-level offers typically run 15–25% below the published median — that gap includes 10-year veterans and senior designers. Knowing the median told Maya she wasn't being lowballed. She was in range — but she wasn't at the ceiling.",
    },
  },
  {
    narrative: (
      <p>
        She spent an evening researching. Then she replied:{" "}
        <Em>
          Based on BLS data for this role and the Atlanta market, I&apos;d like to respectfully ask
          for $55,500.
        </Em>{" "}
        Two days of silence. Then: <Num>$54,000</Num>. She almost said no. She took it. That
        &ldquo;only $2,000 more&rdquo; didn&apos;t feel like much. Over the next decade, it became
        something else entirely.
      </p>
    ),
    term: {
      name: "Salary Negotiation",
      definition:
        "Workers who negotiate their first salary earn $5K–$10K more per year on average than those who don't — not because they're more skilled, but because every future raise is calculated as a percentage of that first number. A higher starting point compounds for decades.",
      impact:
        "Maya's $2,000 negotiated gain at year 1, compounding at 3% annual raises over 10 years, translates to roughly $24,000 more in total earnings compared to taking the original offer. The negotiation took one email and two days of discomfort.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Maya&apos;s coworker Dani also earned $54,500 — same role, same company, hired the same
          month. But Dani had attended a private art school. Total cost:{" "}
          <Num>$147,000 in loans</Num>. Maya&apos;s state school had cost <Num>$34,000</Num>.
        </p>
        <p>
          Identical salaries. But Dani sent <Num>$1,150/month</Num> to a loan servicer. Maya sent{" "}
          <Num>$280/month</Num>. They earned the same. They did not live the same.
        </p>
      </>
    ),
    term: {
      name: "Education ROI",
      definition:
        "Return on investment compares what you paid for your education against the financial outcome it produced. A $147K degree and a $34K degree in the same field frequently produce the same starting salary. The difference isn't earnings — it's debt, and debt payments reduce spendable income directly.",
      impact:
        "The $870/month gap between Maya and Dani's loan payments adds up to $10,440/year — not in salary, but in take-home cash. Over 5 years of repayment: $52,200 more in Maya's pocket. Same career. Same employer. Same salary. Wildly different financial life.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Before her first day, Maya ran one more calculation. <Num>$54,000/year gross</Num>.
          Monthly: <Num>$4,500</Num>. She opened a paycheck estimator and added up all the
          deductions: federal tax, state tax, FICA, health insurance.
        </p>
        <p>
          What landed in her bank account each month: <Num>$3,380</Num>. She said it out loud a
          few times. <Em>&ldquo;Three thousand, three hundred and eighty dollars. That&apos;s my
          budget.&rdquo;</Em> Not $54,000. Not $4,500. $3,380.
        </p>
      </>
    ),
    term: {
      name: "Gross vs. Net Income",
      definition:
        "Gross income is what your employer pays you. Net income is what actually deposits in your bank account after federal tax, state tax, FICA, and benefits deductions. At Maya's salary, those deductions total roughly $1,120/month — a gap that reshapes every budget decision she makes.",
      impact:
        "Maya's $54,000 salary feels like $4,500/month. It behaves like $3,380/month. Her rent, groceries, loan payment, savings, and every other expense all have to fit inside $3,380 — not inside the number that first made her scream.",
    },
  },
  {
    narrative: (
      <p>
        One last thing before she accepted: she looked up the{" "}
        <strong>10-year job outlook</strong> for graphic designers. Projected growth:{" "}
        <Num>3%</Num> — slower than average. She looked up UI/UX designers:{" "}
        <Num>23% growth</Num>. She accepted the offer. She also registered for an online UX
        foundations course. It cost <Num>$400</Num>. Her dad said it was the best investment she&apos;d
        made yet.
      </p>
    ),
    term: {
      name: "10-Year Job Outlook",
      definition:
        "The BLS projects the percentage change in employment for each occupation over the next decade. This number reveals whether demand for workers in that field is expanding, flat, or declining — information that matters enormously over a 40-year career, even if it has zero effect on your first offer.",
      impact:
        "A career in a 23%-growth field vs. a 3%-growth field doesn't just mean job security. Growing fields have more competition for skilled workers, which historically drives faster salary growth. Maya's $400 investment in a UX course was a hedge on her own decade.",
    },
  },
];

export default function CareerNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Maya's First Yes"
      character="A graphic designer, 23 years old, navigating her first real job offer"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Research My Career →"
      ctaSubtitle="You've seen how these numbers worked for Maya. Now let's find yours."
    />
  );
}
