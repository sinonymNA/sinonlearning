"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Button from "./Button";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export default function HeroIntro() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="mx-auto max-w-3xl text-center"
    >
      <motion.span
        variants={item}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-navy-900/10 bg-white px-3.5 py-1.5 text-xs font-medium text-navy-700 shadow-sm"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
        </span>
        Now building: Economics &amp; Personal Finance
      </motion.span>

      <motion.h1
        variants={item}
        className="font-display text-4xl font-medium leading-[1.1] text-navy-900 sm:text-5xl lg:text-6xl"
      >
        Free curriculum and classroom tools for{" "}
        <span className="bg-gradient-to-r from-teal-600 via-rose-400 to-amber-500 bg-clip-text text-transparent">
          better learning
        </span>
        .
      </motion.h1>

      <motion.p
        variants={item}
        className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-700/80"
      >
        Sinon Learning is building a free library of modern curriculum, digital
        textbooks, visual resources, and simple classroom tools—created for real
        teachers and real students.
      </motion.p>

      <motion.div
        variants={item}
        className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <Button href="/curriculum">
          Explore Everyday Curriculum
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
        <Button href="/tools" variant="secondary">
          View Classroom Tools
        </Button>
      </motion.div>

      <motion.p variants={item} className="mx-auto mt-6 max-w-xl text-sm text-navy-700/60">
        Core learning resources will be free because great learning should not be
        locked behind a paywall.
      </motion.p>

      <motion.button
        variants={item}
        onClick={() =>
          document.getElementById("ecosystem")?.scrollIntoView({ behavior: "smooth" })
        }
        className="mx-auto mt-14 flex flex-col items-center gap-1.5 text-navy-700/40 transition-colors hover:text-teal-600"
        aria-label="Scroll to explore"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]">Explore</span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
