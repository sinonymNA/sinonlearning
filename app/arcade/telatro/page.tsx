import type { Metadata } from "next";
import Telatro from "@/components/arcade/telatro/Telatro";

export const metadata: Metadata = { title: "Telatro | Classroom Arcade" };
export default function Page() { return <Telatro />; }
