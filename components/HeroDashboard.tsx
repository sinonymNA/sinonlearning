"use client";

import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  Wrench,
  Star,
  Landmark,
  PiggyBank,
  Scale,
  MonitorPlay,
  TimerIcon,
  Shuffle,
  Gamepad2,
  FlaskConical,
  GraduationCap,
  FileText,
} from "lucide-react";

const curriculumItems = [
  { label: "Economics", icon: Landmark },
  { label: "Personal Finance", icon: PiggyBank },
  { label: "Government", icon: Scale },
];

const toolItems = [
  { label: "Classroom Screen", icon: MonitorPlay },
  { label: "Timer", icon: TimerIcon },
  { label: "Randomizer", icon: Shuffle },
];

const comingNextItems = [
  { label: "Games", icon: Gamepad2 },
  { label: "Simulations", icon: FlaskConical },
  { label: "Student Courses", icon: GraduationCap },
];

const sidebarLinks = [
  { label: "Home", icon: Home, active: true },
  { label: "Curriculum", icon: BookOpen },
  { label: "Tools", icon: Wrench },
  { label: "Favorites", icon: Star },
];

const resources = [
  "Credit, Debt, and Borrowing Unit",
  "Supply & Demand Lesson",
  "Classroom Screen Prototype",
  "World History Visual Map",
];

const badges = ["Free Core Library", "Teacher Built", "In Development"];

const panelGroups = [
  { title: "Everyday Curriculum", items: curriculumItems },
  { title: "Classroom Tools", items: toolItems },
  { title: "Coming Next", items: comingNextItems },
];

export default function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-2xl pt-2 sm:pt-5"
    >
      {/* Floating badges */}
      <div className="relative z-10 mb-3 flex flex-wrap justify-center gap-2 sm:absolute sm:-top-5 sm:left-10 sm:mb-0 sm:justify-start">
        {badges.map((badge, i) => (
          <motion.span
            key={badge}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            className="rounded-full border border-navy-900/10 bg-white px-3 py-1.5 text-xs font-medium text-navy-800 shadow-md"
          >
            {badge}
          </motion.span>
        ))}
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[28px] border border-navy-900/10 bg-white shadow-[0_30px_60px_-15px_rgba(13,27,46,0.25)]"
      >
        <div className="grid sm:grid-cols-[180px_1fr]">
          {/* Sidebar */}
          <div className="hidden flex-col gap-1 bg-navy-950 p-5 sm:flex">
            <div className="mb-6 flex items-center gap-2 px-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
                <BookOpen size={14} />
              </span>
              <span className="font-display text-sm font-medium text-cream-50">
                Sinon Learning
              </span>
            </div>
            {sidebarLinks.map((link) => (
              <div
                key={link.label}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  link.active
                    ? "bg-teal-400/15 text-teal-200"
                    : "text-cream-200/60 hover:text-cream-100"
                }`}
              >
                <link.icon size={16} />
                {link.label}
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="bg-cream-50 p-6 sm:p-7">
            <p className="font-display text-xl font-medium text-navy-900">
              Welcome back, Teacher
            </p>
            <p className="mt-1 text-sm text-navy-700/70">
              Continue building better lessons
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {panelGroups.map((group, i) => (
                <motion.div
                  key={group.title}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`rounded-2xl border p-4 ${
                    i === 2
                      ? "border-dashed border-navy-900/15 bg-cream-100/60"
                      : "border-navy-900/8 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">
                    {group.title}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center gap-2 text-sm text-navy-800/85"
                      >
                        <item.icon size={14} className="text-teal-600" />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-navy-900/8 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">
                Recently Added
              </p>
              <ul className="mt-3 space-y-2.5">
                {resources.map((resource) => (
                  <li
                    key={resource}
                    className="flex items-center gap-2.5 text-sm text-navy-800/85 transition-colors hover:text-teal-700"
                  >
                    <FileText size={14} className="text-navy-700/40" />
                    {resource}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
