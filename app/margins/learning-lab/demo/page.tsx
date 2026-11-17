import Link from "next/link";
import MarginsLogo from "@/components/MarginsLogo";
import LearningLabDemo from "@/components/margins/LearningLabDemo";

export default function LearningLabDemoPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="flex h-16 items-center justify-between border-b border-stone-100 bg-white px-6">
        <Link href="/margins"><MarginsLogo width={100} /></Link>
        <Link href="/margins/signup" className="text-xs font-semibold text-teal-700 hover:text-teal-900">Create an account →</Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <LearningLabDemo />
      </main>
    </div>
  );
}
