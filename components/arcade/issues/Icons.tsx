// Hand-drawn style line icons for Back Issues (replaces emoji so the game has its own look). Stroke icons that inherit currentColor.
import type { ReactElement } from "react";
const S = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const wrap = (d: ReactElement, v = "0 0 24 24") => <svg className="ic" viewBox={v} aria-hidden focusable="false">{d}</svg>;
export const Icon = {
  back: () => wrap(<path {...S} d="M15 5l-7 7 7 7" />),
  menu: () => wrap(<path {...S} d="M4 7h16M4 12h16M4 17h16" />),
  bulb: () => wrap(<g {...S}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></g>),
  pencil: () => wrap(<g {...S}><path d="M4 20l1-4L16 5l3 3L8 19z" /><path d="M14 7l3 3" /></g>),
  search: () => wrap(<g {...S}><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5" /></g>),
  lock: () => wrap(<g {...S}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></g>),
  grid: () => wrap(<g {...S}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 10h16M4 15h16M10 4v16M15 4v16" /></g>),
  sudoku: () => wrap(<g {...S}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16" strokeWidth={1.4} /><path d="M7 7h.01M17 17h.01" strokeWidth={3} /></g>),
  cipher: () => wrap(<g {...S}><circle cx="8" cy="12" r="3.5" /><path d="M11.5 12H21M17 12v3M20 12v2" /></g>),
  star: () => wrap(<path fill="currentColor" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />),
  eraser: () => wrap(<g {...S}><path d="M4 16l9-9 6 6-6 6H8z" /><path d="M11 20h9" /></g>),
  list: () => wrap(<path {...S} d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />),
  check: () => wrap(<path {...S} d="M5 12.5l4.5 4.5L19 7.5" />),
  left: () => wrap(<path {...S} d="M14 6l-6 6 6 6" />),
  right: () => wrap(<path {...S} d="M10 6l6 6-6 6" />),
  eye: () => wrap(<g {...S}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></g>),
};
export type IconName = keyof typeof Icon;
