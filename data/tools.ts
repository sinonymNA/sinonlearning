import type { LucideIcon } from "lucide-react";
import {
  MonitorPlay,
  TimerIcon,
  Shuffle,
  Users,
  BarChart3,
  QrCode,
  ClipboardCheck,
  Rocket,
} from "lucide-react";

export type ToolStatus = "Prototype" | "Planned" | "Coming Later";

export interface Tool {
  name: string;
  status: ToolStatus;
  description: string;
  icon: LucideIcon;
}

export const tools: Tool[] = [
  {
    name: "Classroom Screen",
    status: "Prototype",
    description: "An all-in-one front-of-room display with agenda, timer, and more.",
    icon: MonitorPlay,
  },
  {
    name: "Timer & Agenda",
    status: "Prototype",
    description: "A simple, visible timer paired with the day's plan for students.",
    icon: TimerIcon,
  },
  {
    name: "Random Student Picker",
    status: "Planned",
    description: "Fair, fast random selection for questions, tasks, and turns.",
    icon: Shuffle,
  },
  {
    name: "Group Maker",
    status: "Planned",
    description: "Build balanced groups or pairs in seconds, no spreadsheets needed.",
    icon: Users,
  },
  {
    name: "Polls",
    status: "Planned",
    description: "Quick live polls to check understanding or gather opinions.",
    icon: BarChart3,
  },
  {
    name: "QR Code Generator",
    status: "Coming Later",
    description: "Generate a classroom QR code for any link in one click.",
    icon: QrCode,
  },
  {
    name: "Exit Ticket Builder",
    status: "Coming Later",
    description: "Create a simple exit ticket to close out any lesson.",
    icon: ClipboardCheck,
  },
  {
    name: "Lesson Launcher",
    status: "Coming Later",
    description: "Open everything you need for class from one clean screen.",
    icon: Rocket,
  },
];
