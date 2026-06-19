import Link from "next/link";
import Logo from "./Logo";

const columns = [
  {
    title: "Sinon Learning",
    links: [
      { label: "Home", href: "/" },
      { label: "Mission", href: "/#mission" },
    ],
  },
  {
    title: "Everyday Curriculum",
    links: [
      { label: "Explore Curriculum", href: "/curriculum" },
      { label: "Economics & Finance", href: "/curriculum" },
    ],
  },
  {
    title: "Classroom Tools",
    links: [
      { label: "Explore Tools", href: "/tools" },
      { label: "Classboard", href: "/classboard" },
    ],
  },
  {
    title: "Mission",
    links: [
      { label: "Why Sinon Learning", href: "/#mission" },
      { label: "First Focus", href: "/curriculum" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-grain relative overflow-hidden border-t border-navy-900/8 bg-cream-100 text-navy-700">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-4 mb-4 flex items-center gap-2.5 sm:mb-2">
            <Logo size={28} />
            <span className="font-display text-lg font-medium text-navy-900">
              Sinon Learning
            </span>
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
        </div>
      </div>
    </footer>
  );
}
