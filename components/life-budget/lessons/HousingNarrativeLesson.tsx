"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";
import LeaseVisual from "./LeaseVisual";

const ACCENT = "#0891b2";
const INK = "#0f172a";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    visual: <LeaseVisual highlightSection="affordability" />,
    narrative: (
      <>
        <p>
          Maya had three weeks before her start date and exactly one goal: find an apartment
          in Atlanta. She opened Zillow and immediately found a listing for{" "}
          <Num>$1,150/month</Num>. Studio. Hardwood floors. Natural light. She typed the
          number into her phone calculator to see how it stacked up.
        </p>
        <p>
          Her salary: <Num>$54,000</Num>. Monthly gross: <Num>$4,500</Num>.
          Monthly take-home after taxes and deductions: <Num>$3,380</Num>.
          She&apos;d read about the 30% rule. On her gross salary, 30% was{" "}
          <Num>$1,350</Num> — the apartment was under that. But on her actual take-home,
          30% was only <Num>$1,014</Num>. The same apartment looked very different
          depending on which number she used.
        </p>
      </>
    ),
    term: {
      name: "30% Rule",
      definition:
        "A widely-used guideline: keep housing costs under 30% of your income. But gross or net? Most landlords apply it to gross. Most budgeting advice applies it to net take-home. At Maya's salary, 30% of gross = $1,350 and 30% of net = $1,014 — a $336 gap that matters enormously for what she can realistically afford.",
      impact:
        "$1,150 rent is 25.6% of Maya's gross income — comfortably under the 30% rule. But utilities and renters insurance add ~$195/month, bringing true housing cost to $1,345/month: 39.8% of her net take-home. The 30% rule is a starting point, not a guarantee.",
    },
  },
  {
    visual: <LeaseVisual highlightSection="deposit" />,
    narrative: (
      <>
        <p>
          She called to schedule a showing. The leasing agent ran through the details:{" "}
          <Num>$1,150/month</Num>, first month upfront, plus a security deposit of{" "}
          <Num>$1,725</Num> — a month and a half. Maya did the math quietly. That was{" "}
          <Num>$2,875</Num> due on day one before she&apos;d spent a single night there.
        </p>
        <p>
          She had <Num>$3,200</Num> in savings. She could technically do it.
          She could also barely do it. <Em>&ldquo;What if something breaks before my
          first paycheck?&rdquo;</Em> she asked her dad that night. He didn&apos;t answer
          right away.
        </p>
      </>
    ),
    term: {
      name: "Security Deposit",
      definition:
        "A cash deposit held by your landlord — typically 1–2 months of rent — to cover damages beyond normal wear and tear. You get it back, minus deductions, within 30 days of moving out. It is not pre-paid rent; it's collateral that protects the landlord if you damage the unit or break the lease.",
      impact:
        "A $1,150/month apartment requires $2,875 upfront (first month + 1.5-month deposit) before you can move in. That's money that disappears from your savings on day one. Maya's $3,200 savings would leave her with only $325 as a buffer — barely a week's expenses.",
    },
  },
  {
    visual: <LeaseVisual highlightSection="term" />,
    narrative: (
      <p>
        She went back to the listing and downloaded the sample lease. Twelve pages.
        She read all of them. The one that stopped her:{" "}
        <Em>
          &ldquo;Early termination shall result in a penalty equal to two months&apos; rent
          ($2,300), plus the landlord&apos;s right to retain the full security deposit.&rdquo;
        </Em>{" "}
        Maya sat back. She was about to sign a <Num>$14,400 annual commitment</Num>.
        If she left after month four for any reason — a better job in another city,
        a roommate situation, anything — she&apos;d owe <Num>$2,300</Num> plus lose her
        deposit. She read the section three more times.
      </p>
    ),
    term: {
      name: "Lease Agreement",
      definition:
        "A lease is a legal contract committing both parties — you to pay rent on time, the landlord to maintain the unit — for a specific term, typically 12 months. Breaking it early almost always triggers a financial penalty, often 1–2 months of rent, sometimes plus forfeiture of the security deposit. Month-to-month arrangements avoid this commitment but usually cost more per month.",
      impact:
        "Maya's 12-month lease at $1,150/month represents a $14,400 total commitment. The early termination penalty of $2,300 means any life change before December 2027 has a real dollar cost attached. Reading the lease before signing is how you find out exactly what you're agreeing to.",
    },
  },
  {
    visual: <LeaseVisual highlightSection="utilities" />,
    narrative: (
      <>
        <p>
          She almost missed it, buried in the appliance section:{" "}
          <Em>&ldquo;Utilities not included. Tenant is solely responsible for all utility accounts.&rdquo;</Em>{" "}
          She googled average utility costs for a one-bedroom in Atlanta.
        </p>
        <p>
          Electricity: <Num>$75/month</Num> average. Gas: <Num>$40/month</Num> in winter.
          Internet: <Num>$65/month</Num>. Water was included by the building — one
          small win. Total: <Num>$180/month</Num> extra on top of $1,150. Her real
          housing cost wasn&apos;t $1,150. It was <Num>$1,330</Num> — and she hadn&apos;t even
          factored in renters insurance yet.
        </p>
      </>
    ),
    term: {
      name: "Utilities",
      definition:
        "Utilities are the monthly service costs that keep an apartment functional: electricity, gas, water/sewer, internet, and trash collection. Many rentals do not include them in the monthly rent — 'utilities not included' means you set up and pay for these accounts separately. They must be budgeted in addition to rent.",
      impact:
        "Maya's $1,150 rent becomes $1,330/month with utilities — a 15.6% increase she didn't see in the listing headline. Multiply that $180/month by 12 and utilities alone add $2,160 to her annual housing cost. 'Utilities included' listings that seem more expensive per month sometimes cost less overall.",
    },
  },
  {
    visual: <LeaseVisual highlightSection="insurance" />,
    narrative: (
      <>
        <p>
          Last page of the lease: <Em>&ldquo;Tenant must maintain a valid renters
          insurance policy with minimum $100,000 in liability coverage throughout the lease
          term.&rdquo;</Em> Her landlord required it. She&apos;d never thought about it before.
        </p>
        <p>
          She spent fifteen minutes on a comparison site. A policy covering{" "}
          <Num>$20,000</Num> in personal belongings and <Num>$100,000</Num> in liability:{" "}
          <Num>$14/month</Num>. She thought about her laptop ($1,400), her camera ($600),
          her furniture. One theft. One fire. One burst pipe. Without insurance: she&apos;d
          replace everything herself. She signed up before she even signed the lease.
        </p>
      </>
    ),
    term: {
      name: "Renters Insurance",
      definition:
        "Renters insurance covers your personal belongings against theft, fire, and water damage — and provides personal liability coverage if someone is injured in your unit. Your landlord's insurance covers the building itself, not your possessions. Most landlords require it; it typically costs $12–$18/month for substantial coverage.",
      impact:
        "At $14/month, Maya pays $168/year to insure $20,000 in belongings and $100,000 in liability. Without it, one apartment fire or break-in could wipe out savings she spent months building. Her full housing cost: $1,150 rent + $180 utilities + $14 insurance = $1,344/month.",
    },
  },
];

export default function HousingNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Maya Reads the Fine Print"
      character="A graphic designer, 23 years old, apartment hunting before her first real job"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Find My Apartment →"
      ctaSubtitle="You've seen what Maya discovered in the fine print. Now find your real housing number."
    />
  );
}
