import type { Metadata } from "next";
import "./apwh.css";

export const metadata: Metadata = {
  title: "AP World Headquarters",
  description: "The daily classroom headquarters for AP World History: Modern.",
  robots: { index: false, follow: false },
};

export default function ApwhLayout({ children }: { children: React.ReactNode }) {
  return <div className="apwh-shell">{children}</div>;
}
