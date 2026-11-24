import type { Metadata } from "next";
import CatStack from "@/components/arcade/catstack/CatStack";

export const metadata: Metadata = { title: "Cat Stack | Classroom Arcade" };
export default function Page() { return <CatStack />; }
