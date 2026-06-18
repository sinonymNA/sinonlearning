import type { LucideIcon } from "lucide-react";
import { MonitorPlay, Users, QrCode, Rocket } from "lucide-react";

export type ToolStatus = "Live" | "Prototype" | "Planned" | "Coming Later";

export interface Tool {
  name: string;
  status: ToolStatus;
  description: string;
  icon: LucideIcon;
  href?: string;
}

export const tools: Tool[] = [
  {
    name: "Classboard",
    status: "Live",
    description:
      "An all-in-one front-of-room display: live agenda, timer, student randomizer, polls, exit tickets, and ambient YouTube backgrounds.",
    icon: MonitorPlay,
    href: "/classboard",
  },
  {
    name: "Group Maker",
    status: "Planned",
    description: "Build balanced groups or pairs in seconds, no spreadsheets needed.",
    icon: Users,
  },
  {
    name: "QR Code Generator",
    status: "Coming Later",
    description: "Generate a classroom QR code for any link in one click.",
    icon: QrCode,
  },
  {
    name: "Lesson Launcher",
    status: "Coming Later",
    description: "Open everything you need for class from one clean screen.",
    icon: Rocket,
  },
];
