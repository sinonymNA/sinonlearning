import type { Metadata } from "next";
import Meowdoku from "@/components/arcade/meowdoku/Meowdoku";

export const metadata: Metadata = { title: "Meowdoku | Classroom Arcade" };
export default function Page() { return <Meowdoku />; }
