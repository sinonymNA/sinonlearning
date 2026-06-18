import Link from "next/link";
import { BookOpen } from "lucide-react";

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
      { label: "Classroom Screen", href: "/tools" },
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
    <footer className="border-t border-navy-900/8 bg-navy-950 text-cream-200">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-4 mb-4 flex items-center gap-2 sm:mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
              <BookOpen size={16} strokeWidth={2.25} />
            </span>
            <span className="font-display text-lg font-medium text-cream-50">
              Sinon Learning
            </span>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-cream-50">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-200/70 transition-colors hover:text-teal-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-cream-50/10 pt-8 text-sm text-cream-200/60">
          © 2026 Sinon Learning. Built for teachers, students, and better classrooms.
        </div>
      </div>
    </footer>
  );
}
