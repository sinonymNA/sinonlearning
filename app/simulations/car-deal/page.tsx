"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type LoanOffer = {
  id: string;
  label: string;
  monthly: number;
  months: number;
  totalPayments: number;
  detail: string;
  insight: string;
};

type AddOn = {
  id: string;
  label: string;
  price: number;
  detail: string;
};

const loanOffers: LoanOffer[] = [
  {
    id: "low-payment",
    label: "Dealer's low-payment plan",
    monthly: 319,
    months: 84,
    totalPayments: 26796,
    detail: "7 years • 12.9% APR • $2,500 down",
    insight: "The payment fits, but seven years of interest makes this the most expensive loan.",
  },
  {
    id: "dealer-balanced",
    label: "Dealer's balanced plan",
    monthly: 397,
    months: 48,
    totalPayments: 19056,
    detail: "4 years • 6.2% APR • $2,500 down",
    insight: "A much shorter term keeps the total cost in check, but the dealer's rate is not your only option.",
  },
  {
    id: "bank",
    label: "Your bank pre-approval",
    monthly: 383,
    months: 48,
    totalPayments: 18384,
    detail: "4 years • 5.1% APR • $2,500 down",
    insight: "Pre-approval protects you from being anchored on a monthly payment and costs the least over the loan.",
  },
];

const addOns: AddOn[] = [
  {
    id: "paint",
    label: "Paint protection package",
    price: 795,
    detail: "Dealer-applied coating with a limited warranty.",
  },
  {
    id: "theft",
    label: "Theft-recovery system",
    price: 895,
    detail: "A tracking service that may overlap with insurance coverage.",
  },
  {
    id: "maintenance",
    label: "Prepaid maintenance plan",
    price: 799,
    detail: "Oil changes and scheduled services bundled up front.",
  },
];

const negotiationChoices = [
  {
    id: "accept",
    label: "Sign the paperwork as presented",
    savings: 0,
    detail: "No questions asked; the $599 documentation fee remains.",
  },
  {
    id: "ask",
    label: "Ask for an itemized out-the-door quote",
    savings: 400,
    detail: "The dealership reduces its documentation fee to $199.",
  },
  {
    id: "walk",
    label: "Walk away from the forced add-on bundle",
    savings: 250,
    detail: "The dealer removes a bundled accessory charge after you push back.",
  },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function CarDealGamePage() {
  const [step, setStep] = useState(0);
  const [loanId, setLoanId] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [negotiationId, setNegotiationId] = useState<string | null>(null);

  const loan = loanOffers.find((offer) => offer.id === loanId);
  const negotiation = negotiationChoices.find((choice) => choice.id === negotiationId);
  const addOnTotal = addOns
    .filter((addOn) => selectedAddOns.includes(addOn.id))
    .reduce((total, addOn) => total + addOn.price, 0);

  const results = useMemo(() => {
    const loanScore =
      loanId === "bank" ? 35 : loanId === "dealer-balanced" ? 25 : 10;
    const addOnScore = Math.max(0, 30 - Math.round((addOnTotal / 2490) * 30));
    const negotiationScore =
      negotiationId === "ask" ? 25 : negotiationId === "walk" ? 18 : 0;
    const affordabilityScore = loan && loan.monthly <= 425 ? 10 : 0;
    const score = loanScore + addOnScore + negotiationScore + affordabilityScore;

    return {
      score,
      total: (loan?.totalPayments ?? 0) + addOnTotal - (negotiation?.savings ?? 0),
      grade:
        score >= 85
          ? "Sharp shopper"
          : score >= 65
            ? "Careful comparer"
            : "Room to negotiate",
    };
  }, [addOnTotal, loan, loanId, negotiation, negotiationId]);

  const resetGame = () => {
    setStep(0);
    setLoanId(null);
    setSelectedAddOns([]);
    setNegotiationId(null);
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const canAdvance =
    step === 0 ||
    (step === 1 && loanId) ||
    step === 2 ||
    (step === 3 && negotiationId);

  const next = () => {
    if (canAdvance) setStep((current) => Math.min(current + 1, 4));
  };

  const stepLabels = ["Brief", "Financing", "Add-ons", "Negotiate", "Result"];

  return (
    <main className="min-h-screen bg-cream-50 text-navy-900">
      <section className="border-b border-navy-900/10 bg-navy-900 text-cream-50">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
          <Link href="/simulations" className="text-sm text-teal-200 hover:text-white">
            ← Simulations & Games
          </Link>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">
            Case File 01 · Consumer Skills
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            The Car Deal
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-cream-100/80">
            Can you see past the low monthly payment and build the best deal for a first-time buyer?
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <div className="mb-8 grid grid-cols-5 gap-2" aria-label="Game progress">
          {stepLabels.map((label, index) => (
            <div key={label}>
              <div
                className={`h-1 rounded-full ${index <= step ? "bg-teal-600" : "bg-cream-300"}`}
              />
              <p className={`mt-2 text-xs font-medium ${index === step ? "text-navy-900" : "text-navy-700/50"}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {step === 0 && (
          <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-3xl border border-navy-900/10 bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold text-teal-700">Your client</p>
              <h2 className="mt-2 font-display text-3xl">Jordan needs a dependable ride.</h2>
              <p className="mt-4 leading-7 text-navy-700">
                Jordan just started a job and has $2,500 saved for a down payment. The commute is long, but their
                monthly car payment cannot exceed <strong>$425</strong> without crowding out rent, food, and savings.
              </p>
              <div className="mt-6 rounded-2xl bg-cream-100 p-5 text-sm leading-6 text-navy-700">
                <strong className="block text-navy-900">Your mission</strong>
                Review the evidence, choose financing, reject or accept add-ons, and negotiate. The best deal balances
                affordability, lifetime cost, and smart consumer choices.
              </div>
            </div>
            <aside className="rounded-3xl bg-teal-700 p-7 text-white">
              <p className="text-sm font-semibold text-teal-100">Case evidence</p>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-teal-50">
                <li><strong>Vehicle:</strong> Used 2022 compact sedan</li>
                <li><strong>Sticker price:</strong> $18,900</li>
                <li><strong>Cash available:</strong> $2,500</li>
                <li><strong>Payment ceiling:</strong> $425/month</li>
              </ul>
            </aside>
          </section>
        )}

        {step === 1 && (
          <section>
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-teal-700">Clue 1 of 3</p>
              <h2 className="mt-2 font-display text-3xl">A monthly payment is not the whole price.</h2>
              <p className="mt-3 leading-7 text-navy-700">
                Choose a financing offer. All numbers include the down payment; compare the length and total payment.
              </p>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {loanOffers.map((offer) => {
                const selected = loanId === offer.id;
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => setLoanId(offer.id)}
                    className={`rounded-3xl border p-6 text-left transition ${selected ? "border-teal-600 bg-teal-50 ring-2 ring-teal-200" : "border-navy-900/10 bg-white hover:border-teal-400"}`}
                    aria-pressed={selected}
                  >
                    <p className="text-sm font-semibold text-teal-700">{offer.label}</p>
                    <p className="mt-4 font-display text-4xl">{formatMoney(offer.monthly)}<span className="text-lg">/mo</span></p>
                    <p className="mt-2 text-sm text-navy-700">{offer.detail}</p>
                    <div className="mt-5 border-t border-navy-900/10 pt-4 text-sm leading-6 text-navy-700">
                      Total loan payments: <strong className="text-navy-900">{formatMoney(offer.totalPayments)}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-teal-700">Clue 2 of 3</p>
              <h2 className="mt-2 font-display text-3xl">The finance office has three extras ready.</h2>
              <p className="mt-3 leading-7 text-navy-700">
                Each may be useful in a particular situation, but none is required to purchase the car. Select only what
                you believe belongs in Jordan&apos;s deal.
              </p>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {addOns.map((addOn) => {
                const selected = selectedAddOns.includes(addOn.id);
                return (
                  <button
                    key={addOn.id}
                    type="button"
                    onClick={() => toggleAddOn(addOn.id)}
                    className={`rounded-3xl border p-6 text-left transition ${selected ? "border-teal-600 bg-teal-50 ring-2 ring-teal-200" : "border-navy-900/10 bg-white hover:border-teal-400"}`}
                    aria-pressed={selected}
                  >
                    <p className="text-sm font-semibold text-teal-700">{selected ? "Added to deal" : "Optional add-on"}</p>
                    <h3 className="mt-3 text-lg font-semibold">{addOn.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-navy-700">{addOn.detail}</p>
                    <p className="mt-5 text-xl font-semibold">{formatMoney(addOn.price)}</p>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 text-sm text-navy-700">Selected extras: <strong>{formatMoney(addOnTotal)}</strong></p>
          </section>
        )}

        {step === 3 && (
          <section>
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-teal-700">Clue 3 of 3</p>
              <h2 className="mt-2 font-display text-3xl">The paperwork is on the desk.</h2>
              <p className="mt-3 leading-7 text-navy-700">
                The dealer says the offer expires today. Pick Jordan&apos;s next move.
              </p>
            </div>
            <div className="mt-6 grid gap-4">
              {negotiationChoices.map((choice) => {
                const selected = negotiationId === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setNegotiationId(choice.id)}
                    className={`rounded-2xl border p-6 text-left transition ${selected ? "border-teal-600 bg-teal-50 ring-2 ring-teal-200" : "border-navy-900/10 bg-white hover:border-teal-400"}`}
                    aria-pressed={selected}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold">{choice.label}</h3>
                      <span className="rounded-full bg-cream-100 px-3 py-1 text-sm font-semibold text-navy-700">
                        {choice.savings ? `Save ${formatMoney(choice.savings)}` : "No savings"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-navy-700">{choice.detail}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 4 && loan && negotiation && (
          <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="rounded-3xl bg-navy-900 p-7 text-white">
              <p className="text-sm font-semibold text-teal-200">Your Best Deal score</p>
              <p className="mt-2 font-display text-7xl">{results.score}<span className="text-2xl text-cream-100/70">/100</span></p>
              <p className="mt-4 text-xl font-semibold">{results.grade}</p>
              <p className="mt-3 text-sm leading-6 text-cream-100/75">
                A great deal is affordable now and still makes sense after every payment has been made.
              </p>
            </aside>
            <div className="rounded-3xl border border-navy-900/10 bg-white p-7">
              <p className="text-sm font-semibold text-teal-700">Your deal, explained</p>
              <h2 className="mt-2 font-display text-3xl">You chose {loan.label}.</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-cream-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">Monthly payment</p>
                  <p className="mt-1 text-2xl font-semibold">{formatMoney(loan.monthly)}</p>
                  <p className="mt-1 text-sm text-navy-700">{loan.monthly <= 425 ? "Within Jordan's limit" : "Over Jordan's limit"}</p>
                </div>
                <div className="rounded-2xl bg-cream-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">Estimated deal total</p>
                  <p className="mt-1 text-2xl font-semibold">{formatMoney(results.total)}</p>
                  <p className="mt-1 text-sm text-navy-700">Loan payments, extras, and savings</p>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm leading-6 text-navy-700">
                <p><strong className="text-navy-900">Financing:</strong> {loan.insight}</p>
                <p><strong className="text-navy-900">Add-ons:</strong> You selected {selectedAddOns.length ? `${selectedAddOns.length} optional add-on${selectedAddOns.length === 1 ? "" : "s"}` : "no optional add-ons"}, adding {formatMoney(addOnTotal)}.</p>
                <p><strong className="text-navy-900">Negotiation:</strong> {negotiation.detail}</p>
              </div>
              <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-900">
                <strong>Takeaway:</strong> Ask for an itemized out-the-door price, compare financing before you visit, and
                take time to understand any optional product before signing.
              </div>
            </div>
          </section>
        )}

        {step < 4 && (
          <div className="mt-10 flex items-center justify-between border-t border-navy-900/10 pt-6">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance}
              className="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step === 3 ? "See my deal score" : "Continue"}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetGame}
              className="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Play again
            </button>
            <Link href="/simulations" className="rounded-full border border-navy-900/15 px-6 py-3 text-sm font-semibold text-navy-800 transition hover:bg-cream-100">
              Explore more simulations
            </Link>
          </div>
        )}

        <p className="mt-12 border-t border-navy-900/10 pt-5 text-xs leading-5 text-navy-700/60">
          This fictional case is for classroom learning and is not personal financial advice. Actual loan terms and
          optional products vary by buyer, vehicle, and lender.
        </p>
      </div>
    </main>
  );
}
