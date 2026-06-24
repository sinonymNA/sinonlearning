"use client";

import { Download, FileText, Sparkles, SquareStack } from "lucide-react";

export type MobileTab = "pages" | "editor" | "comet" | "export";

interface StudioMobileTabsProps {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const TABS: { value: MobileTab; label: string; icon: React.ReactNode }[] = [
  { value: "pages", label: "Pages", icon: <SquareStack size={16} /> },
  { value: "editor", label: "Editor", icon: <FileText size={16} /> },
  { value: "comet", label: "Comet", icon: <Sparkles size={16} /> },
  { value: "export", label: "Export", icon: <Download size={16} /> },
];

export default function StudioMobileTabs({ active, onChange }: StudioMobileTabsProps) {
  return (
    <div className="no-print flex border-t border-navy-900/8 bg-white">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
            active === tab.value ? "text-teal-700" : "text-navy-700/50"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
