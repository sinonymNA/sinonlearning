"use client";

import { useEffect, type RefObject } from "react";
import { animate, stagger } from "animejs";

export interface RevealOpts {
  delay?: number;
  duration?: number;
  translateY?: number;
  stagger?: number;
  easing?: string;
}

export function revealStagger(container: HTMLElement, selector: string, opts: RevealOpts = {}) {
  const els = container.querySelectorAll<HTMLElement>(selector);
  if (els.length === 0) return;
  animate(els, {
    opacity: [0, 1],
    translateY: [opts.translateY ?? 18, 0],
    duration: opts.duration ?? 480,
    delay: stagger(opts.stagger ?? 70, { start: opts.delay ?? 0 }),
    easing: opts.easing ?? "outQuart",
    // Clear the inline opacity/transform once settled so Tailwind state classes
    // (e.g. disabled:opacity-60) can still control the element afterward —
    // anime.js writes inline styles that would otherwise permanently win.
    onComplete: () => {
      els.forEach((el) => {
        el.style.opacity = "";
        el.style.transform = "";
      });
    },
  });
}

export function useMountReveal(
  ref: RefObject<HTMLElement | null>,
  selector: string,
  opts?: RevealOpts
) {
  useEffect(() => {
    if (!ref.current) return;
    revealStagger(ref.current, selector, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useScrollReveal(
  ref: RefObject<HTMLElement | null>,
  selector: string,
  opts?: RevealOpts
) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          revealStagger(el, selector, opts);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// Count-up tween for score reveals — animates a plain object's value and writes
// it into the target element's textContent on every frame (no anime.js plugin
// needed for DOM-text tweening).
export function animateNumber(
  el: HTMLElement,
  from: number,
  to: number,
  duration = 900,
  decimals = 1
) {
  const obj = { val: from };
  animate(obj, {
    val: to,
    duration,
    easing: "outQuart",
    onUpdate: () => {
      const rounded = Math.round(obj.val * 10 ** decimals) / 10 ** decimals;
      el.textContent = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
    },
  });
}
