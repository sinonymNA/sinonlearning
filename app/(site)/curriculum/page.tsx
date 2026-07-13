import type { Metadata } from "next";
import CurriculumLanding from "@/components/curriculum/CurriculumLanding";
import { courses, courseIncludes, firstBuildRoadmap } from "@/data/courses";

export const metadata: Metadata = {
  title: "Curriculum Worth Getting Excited to Teach | Sinon Learning",
  description: "Explore free, story-first curriculum designed to make real classrooms feel alive—beginning with the complete Everyday Economics course.",
};

export default function CurriculumPage() {
  return <CurriculumLanding courses={courses} courseIncludes={courseIncludes} roadmap={firstBuildRoadmap} />;
}
