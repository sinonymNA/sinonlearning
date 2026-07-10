import Link from "next/link";
import SinonWordmark from "./SinonWordmark";

const columns = [
  {
    title: "Curriculum",
    links: [
      { label: "Explore Curriculum", href: "/curriculum" },
      { label: "AI Literacy", href: "/ai" },
    ],
  },
  {
    title: "Teachers",
    links: [
      { label: "Teacher Apps", href: "/teachers" },
      { label: "Margins — Essay Grading", href: "/margins" },
      { label: "Slider — Slideshow Builder", href: "/slider" },
      { label: "Reel — Explainer Videos", href: "/reel" },
      { label: "Dash — Classroom Display", href: "/dash" },
      { label: "Scaffold — Notes Generator", href: "/notesheet" },
      { label: "Classroom Tools", href: "/tools" },
      { label: "Simulations & Games", href: "/simulations" },
    ],
  },
  {
    title: "Students",
    links: [
      { label: "Explore Student Resources", href: "/students" },
      { label: "Simulations & Games", href: "/simulations" },
      { label: "Digital Textbooks", href: "/textbooks" },
    ],
  },
  {
    title: "Research",
    links: [
      { label: "Explore Research", href: "/research" },
      { label: "KORA Model", href: "/research/kora-model" },
      { label: "Educational Theory", href: "/educational-theory" },
    ],
  },
  {
    title: "Mission",
    links: [
      { label: "Why Sinon Learning", href: "/mission" },
      { label: "KORA Constitution", href: "/mission/kora-constitution" },
    ],
  },
  {
    title: "Shop & Fundraisers",
    links: [
      { label: "Shop & Fundraisers", href: "/shop-fundraisers" },
      { label: "Financial Framework", href: "/shop-fundraisers/financial-framework" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-grain relative overflow-hidden border-t border-navy-900/8 bg-cream-100 text-navy-700">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-6 mb-4 sm:mb-2">
            <div className="flex items-center">
              <SinonWordmark width={150} deferUntilInView />
            </div>
            <p className="mt-3 text-sm text-navy-700/60">
              Free education. Human teachers. Powerful tools.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-navy-900">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-navy-700/70 transition-colors hover:text-teal-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-navy-900/10 pt-8 text-sm text-navy-700/60">
          © 2026 Sinon Learning. Built for teachers, students, and better classrooms.
          <span className="ml-2">Made with care for teaching and learning.</span>
        </div>
      </div>
    </footer>
  );
}
