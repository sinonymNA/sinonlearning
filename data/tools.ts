import type { LucideIcon } from "lucide-react";
import { Users, QrCode, Rocket, Gamepad2, Joystick, BookOpenText } from "lucide-react";

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
    name: "Pacer",
    status: "Live",
    description:
      "Open any PDF or EPUB and read it at a pace you choose: one word at a time, a moving highlight, or a smooth auto-scroll. Train your speed with recall check-ins. Files never leave your device.",
    icon: BookOpenText,
    href: "/pacer",
  },
  {
    name: "Classroom Arcade",
    status: "Live",
    description:
      "Five original multiplayer party games for up to 40 students: Hot Potato, Quick Draw, Last One Standing, Telephone, and Imposter. Host with a room code, play on any device.",
    icon: Joystick,
    href: "/arcade",
  },
  {
    name: "Game Show Generator",
    status: "Live",
    description:
      "Turn any vocab list, study guide, or set of standards into a trivia grid, mystery wheel, answers showdown, and more—ready to project in minutes.",
    icon: Gamepad2,
    href: "/game-shows",
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
