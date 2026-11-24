import type { Metadata } from "next";
import NutSort from "@/components/arcade/nuts/NutSort";

export const metadata: Metadata = { title: "Bolt Sort | Classroom Arcade" };
export default function Page() { return <NutSort />; }
