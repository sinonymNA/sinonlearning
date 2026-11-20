import type { Metadata } from "next";
import Gridiron from "@/components/arcade/gridiron/Gridiron";

export const metadata: Metadata = { title: "Retro Gridiron | Classroom Arcade" };
export default function Page() { return <Gridiron />; }
