"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";
import InsurancePlanVisual from "./InsurancePlanVisual";

const ACCENT = "#059669";
const INK = "#0f172a";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    visual: <InsurancePlanVisual highlightSection="premium" />,
    narrative: (
      <>
        <p>
          The email arrived on a Tuesday: <Em>Open Enrollment closes November 15.
          Log in to select your 2027 benefits.</Em> Maya had been at Apex Creative
          for three months. She&apos;d been on her parents&apos; insurance until now.
          This was the first time she&apos;d had to choose.
        </p>
        <p>
          She clicked through the portal. Three plans. The first thing she saw was the
          monthly cost — <Num>$148</Num>, <Num>$235</Num>, <Num>$360</Num>. Her
          first instinct was automatic: pick the cheapest one. Then she remembered
          something her coworker had told her:{" "}
          <Em>&ldquo;The premium is what you pay to have the plan. It&apos;s not what you pay
          when you actually use it. Those are different numbers.&rdquo;</Em>
        </p>
      </>
    ),
    term: {
      name: "Premium",
      definition:
        "A premium is the monthly amount you pay to maintain your health insurance coverage — regardless of whether you visit a doctor, fill a prescription, or have any medical need at all. It's the cost of access to the plan, not the cost of care. A lower premium means lower monthly expense but typically higher costs when you do use the insurance.",
      impact:
        "Maya pays her premium whether she sees a doctor that month or not. The Bronze plan's $148/month premium saves her $87/month over Silver — but only if she stays healthy. One unexpected hospitalization under Bronze could quickly cost more than the $1,044/year she saved in premiums. The premium is just the first number.",
    },
  },
  {
    visual: <InsurancePlanVisual highlightSection="deductible" />,
    narrative: (
      <>
        <p>
          She zoomed past the premium row and found the deductible column.
          Bronze: <Num>$6,500</Num>. Silver: <Num>$2,000</Num>. Gold: <Num>$800</Num>.
        </p>
        <p>
          She thought about the hiking trip she had booked for March — her first real
          vacation since starting work. Mountains in North Carolina. Her friend had broken
          her ankle on a trail two summers ago. <Num>$4,800</Num> hospital bill.
          On a Bronze plan, Maya would pay the full $4,800 herself before insurance
          contributed a cent. On Silver, she&apos;d pay the first <Num>$2,000</Num>.
          The $87/month premium savings from Bronze suddenly looked like a much smaller number.
        </p>
      </>
    ),
    term: {
      name: "Deductible",
      definition:
        "Your deductible is the dollar amount you pay out-of-pocket for covered medical services before your insurance begins to contribute. A $6,500 deductible means you pay the first $6,500 of covered costs each year before the insurance company pays anything. Higher deductible = lower monthly premium, but more financial exposure when something goes wrong.",
      impact:
        "If Maya breaks an ankle on the March hiking trip: Bronze plan, she pays $4,800 (the full bill, under her $6,500 deductible). Silver plan, she pays $2,000 (hits her deductible faster) then 20% coinsurance on the remaining $2,800 = $2,560 total. Bronze saves $87/month but costs $2,240 more on that one visit. The break-even is the key question.",
    },
  },
  {
    visual: <InsurancePlanVisual highlightSection="copay" />,
    narrative: (
      <>
        <p>
          Maya went to the doctor twice a year: once for an annual physical, once when
          she inevitably caught something in February. She also had a standing prescription
          for a generic medication she&apos;d been on since college.
        </p>
        <p>
          She found the copay column. After hitting her deductible, each primary care
          visit: <Num>$25</Num> on Silver. Each prescription refill: <Num>$10</Num>.
          She did the math for a normal year. Two visits at $25 plus 12 prescription
          refills at $10: <Num>$170</Num> in copays. Numbers that fit inside a monthly
          budget without requiring any emergency math.
        </p>
      </>
    ),
    term: {
      name: "Copay",
      definition:
        "A copay is a fixed dollar amount you pay for a specific covered service — a primary care visit, a specialist, a prescription — typically after your deductible has been met for the year. Unlike coinsurance (a percentage), a copay is always the same flat amount for the same service type. Copays apply to the predictable, recurring costs of using healthcare.",
      impact:
        "Maya's regular healthcare needs — 2 doctor visits + 12 prescription refills per year — cost her $170 in copays on the Silver plan. That's $14.17/month of predictable, budgetable healthcare expense. Knowing the copay structure lets her project her actual healthcare costs, not just the monthly premium.",
    },
  },
  {
    visual: <InsurancePlanVisual highlightSection="coinsurance" />,
    narrative: (
      <>
        <p>
          The portal had a plan comparison tool. She clicked <Em>see how the plans work
          together</Em> and found a diagram she had to read twice.
        </p>
        <p>
          After hitting your deductible: the insurance and you split the remaining costs.
          On Silver: they pay <Num>80%</Num>. You pay <Num>20%</Num>.
          She ran through the ankle scenario again. $4,800 bill. First $2,000: she pays.
          Remaining $2,800: she pays 20% = <Num>$560</Num>. Her total out-of-pocket
          for the hike: <Num>$2,560</Num>. Not catastrophic. Uncomfortable, but not
          the kind of number that wipes out savings entirely. That was the point.
        </p>
      </>
    ),
    term: {
      name: "Coinsurance",
      definition:
        "After you've paid your deductible for the year, coinsurance is the percentage split of remaining covered costs between you and your insurance company. An 80/20 plan means insurance pays 80% and you pay 20% of covered costs beyond your deductible. This continues until you reach your out-of-pocket maximum for the year.",
      impact:
        "Maya's $4,800 bill on the Silver plan: $2,000 deductible (100% her) + $2,800 remaining × 20% = $560 coinsurance. Total: $2,560 out-of-pocket. On Bronze, the same bill would cost $4,800 (under the $6,500 deductible, so insurance pays nothing). The coinsurance kicks in only after the deductible — and the deductible is the number that matters most.",
    },
  },
  {
    visual: <InsurancePlanVisual highlightSection="oopmax" />,
    narrative: (
      <>
        <p>
          There was one more row at the bottom of the comparison: out-of-pocket maximum.
          Bronze: <Num>$8,700</Num>. Silver: <Num>$6,000</Num>. Gold: <Num>$4,500</Num>.
        </p>
        <p>
          The portal explained it in one line:{" "}
          <Em>Once you reach this amount, your plan covers 100% of covered costs for
          the rest of the benefit year.</Em> This was the safety net. The number that
          meant no matter how bad a year got — a surgery, an accident, a serious diagnosis —
          she would never pay more than that amount for covered care. She clicked Silver.
          <Num> $235/month</Num>, <Num>$2,000</Num> deductible, <Num>$6,000</Num> out-of-pocket
          maximum. She submitted her selection at 11:43 PM on November 14th.
        </p>
      </>
    ),
    term: {
      name: "Out-of-Pocket Maximum",
      definition:
        "The out-of-pocket maximum is the most you will ever pay in a single plan year for covered medical services — combining deductibles, copays, and coinsurance. Once you reach this cap, your insurance pays 100% of all remaining covered costs for that year. It is the ceiling on your financial exposure, no matter how serious your medical situation becomes.",
      impact:
        "Maya's Silver plan OOP max: $6,000. If she has a catastrophic year — a major surgery, an extended hospitalization — her total cost is $6,000, not $60,000. On Bronze, the same scenario costs $8,700. The $125/month premium difference between Silver and Bronze becomes $2,700 in additional exposure during a worst-case year. The OOP max is what makes insurance feel like insurance.",
    },
  },
];

export default function InsuranceNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Maya's 11:43 PM Decision"
      character="A graphic designer, 23 years old, navigating her first open enrollment deadline"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Choose My Insurance →"
      ctaSubtitle="You've seen what Maya learned before her deadline. Now let's find the right plan for you."
    />
  );
}
