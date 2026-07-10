import Link from "next/link";

const games = [
  {
    eyebrow: "Case File 01 · Consumer Skills",
    title: "The Car Deal",
    description:
      "Investigate financing, dealer extras, and the true cost of a first car. Can you earn the Best Deal score?",
    href: "/simulations/car-deal",
    time: "10–15 min",
    status: "Play now",
  },
  {
    eyebrow: "Coming next · Housing",
    title: "The Apartment File",
    description:
      "Compare rent, utilities, deposits, roommates, and lease terms before moving in.",
    href: null,
    time: "In development",
    status: "Coming soon",
  },
  {
    eyebrow: "Coming next · Consumer Safety",
    title: "The Too-Good Job",
    description:
      "Read the evidence, uncover a job scam, and protect a new paycheck.",
    href: null,
    time: "In development",
    status: "Coming soon",
  },
];

export default function SimulationsPage() {
  return (
    <main className="min-h-screen bg-cream-50 text-navy-900">
      <section className="border-b border-navy-900/10 bg-grain">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Sinon Learning
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
            Learn money skills by making the call.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-navy-700">
            Short case-file games for students to investigate real-world choices, test their instincts, and see the
            consequences.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {games.map((game) => (
            <article
              key={game.title}
              className="flex min-h-80 flex-col rounded-3xl border border-navy-900/10 bg-white p-7 shadow-sm"
            >
              <p className="text-sm font-semibold text-teal-700">{game.eyebrow}</p>
              <h2 className="mt-4 font-display text-3xl">{game.title}</h2>
              <p className="mt-4 text-sm leading-6 text-navy-700">{game.description}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-8">
                <span className="text-sm font-medium text-navy-700/60">{game.time}</span>
                {game.href ? (
                  <Link
                    href={game.href}
                    className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    {game.status}
                  </Link>
                ) : (
                  <span className="rounded-full bg-cream-100 px-4 py-2 text-sm font-semibold text-navy-700">
                    {game.status}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
