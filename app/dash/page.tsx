import type { Metadata } from "next";
import Dash from "@/components/dash/Dash";

export const metadata: Metadata = {
  title: "Dash — Sinon Learning",
  description:
    "Dash is a free, all-in-one front-of-room display with a live agenda, timer, student randomizer, polls, exit tickets, and ambient YouTube backgrounds.",
};

export default function DashPage() {
  return <Dash />;
}
