import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/Button";
import CourseMaterialsSection from "@/components/materials/CourseMaterialsSection";
import EconHero from "@/components/curriculum/EconHero";
import EconPhases from "@/components/curriculum/EconPhases";
import EconLessonDNA from "@/components/curriculum/EconLessonDNA";
import EconUnitGrid from "@/components/curriculum/EconUnitGrid";
import EconSampleDay from "@/components/curriculum/EconSampleDay";
import EconCalendar from "@/components/curriculum/EconCalendar";
import EconFlagshipProjects from "@/components/curriculum/EconFlagshipProjects";
import EconSupplyDemandLab from "@/components/curriculum/EconSupplyDemandLab";
import EconStandards from "@/components/curriculum/EconStandards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Everyday Economics | Sinon Learning",
  description: "A story-first, inquiry-driven economics and personal finance course mapped across a complete semester.",
};

export default function EverydayEconomicsPage() {
  return (
    <>
      <EconHero />
      <EconPhases />
      <EconLessonDNA />
      <EconUnitGrid />
      <EconSampleDay />
      <EconCalendar />
      <EconFlagshipProjects />
      <EconSupplyDemandLab />
      <EconStandards />

      <section id="course-materials" className="scroll-mt-24 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <CourseMaterialsSection courseSlug="everyday-economics" />
          </FadeIn>
        </div>
      </section>

      <section className="bg-econ-900 px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">
              Ready to bring Everyday Economics into your classroom?
            </h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button href="/curriculum" variant="primary" className="!bg-white !text-econ-900 hover:!bg-cream-100">
                Back to all courses
                <ArrowRight size={15} />
              </Button>
              <Button href="/teachers" variant="ghost">
                For teachers
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
