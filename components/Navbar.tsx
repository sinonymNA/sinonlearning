"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/curriculum", label: "Everyday Curriculum" },
  { href: "/ai", label: "Learn About AI" },
  { href: "/simulations", label: "Simulations & Games" },
  { href: "/tools", label: "Classroom Tools" },
  { href: "/educational-theory", label: "Educational Theory" },
  { href: "/#mission", label: "Mission" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-cream-50/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled
          ? "border-navy-900/8 shadow-[0_4px_20px_rgba(13,27,46,0.06)]"
          : "border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo size={32} />
          <span className="font-display text-lg font-medium text-navy-900">
            Sinon Learning
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative py-1 text-sm font-medium text-navy-800/80 transition-colors hover:text-teal-700"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-teal-600 transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </div>

        <button
          className="flex items-center justify-center rounded-full p-2 text-navy-900 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-navy-900/8 bg-cream-50 lg:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-4">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
