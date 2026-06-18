"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Menu, X } from "lucide-react";
import Button from "./Button";

const links = [
  { href: "/", label: "Home" },
  { href: "/curriculum", label: "Everyday Curriculum" },
  { href: "/tools", label: "Classroom Tools" },
  { href: "/#mission", label: "Mission" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-900/8 bg-cream-50/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-teal-300">
            <BookOpen size={16} strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-medium text-navy-900">
            Sinon Learning
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy-800/80 transition-colors hover:text-teal-700"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:block">
          <Button href="/curriculum" size="sm">
            Browse Free Curriculum
          </Button>
        </div>

        <button
          className="flex items-center justify-center rounded-full p-2 text-navy-900 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-navy-900/8 bg-cream-50 px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy-800/80 transition-colors hover:text-teal-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button href="/curriculum" size="sm" className="mt-2 w-full">
              Browse Free Curriculum
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
