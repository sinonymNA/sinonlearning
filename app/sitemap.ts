import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { getPublishedTextbooks } from "@/lib/textbooks";
import { simulations } from "@/data/simulations";
import { courses } from "@/data/courses";
import { teacherTools } from "@/data/teacherTools";
import { studentResources } from "@/data/students";
import { teachingLabTopics } from "@/data/teachingLab";
import { researchTopics } from "@/data/research";
import { missionTopics } from "@/data/missionTopics";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/curriculum",
    "/ai",
    "/tools",
    "/classboard",
    "/educational-theory",
    "/simulations",
    "/textbooks",
    "/teacher-tools",
    "/teachers",
    "/notesheet",
    "/students",
    "/teaching-lab",
    "/research",
    "/research/kora-model",
    "/mission",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const posts = await getPublishedPosts();
  const postRoutes = posts.map((post) => ({
    url: `${SITE_URL}/educational-theory/${post.slug}`,
    lastModified: new Date(post.updated_at),
  }));

  const simulationRoutes = simulations.map((sim) => ({
    url: `${SITE_URL}/simulations/${sim.slug}`,
    lastModified: new Date(),
  }));

  const courseRoutes = courses.map((course) => ({
    url: `${SITE_URL}/curriculum/${course.slug}`,
    lastModified: new Date(),
  }));

  const textbooks = await getPublishedTextbooks();
  const textbookRoutes = textbooks.map((book) => ({
    url: `${SITE_URL}/textbooks/${book.slug}`,
    lastModified: new Date(book.updated_at),
  }));

  const teacherToolRoutes = teacherTools.map((entry) => ({
    url: `${SITE_URL}/teacher-tools/${entry.slug}`,
    lastModified: new Date(),
  }));

  const studentRoutes = studentResources.map((entry) => ({
    url: `${SITE_URL}/students/${entry.slug}`,
    lastModified: new Date(),
  }));

  const teachingLabRoutes = teachingLabTopics.map((entry) => ({
    url: `${SITE_URL}/teaching-lab/${entry.slug}`,
    lastModified: new Date(),
  }));

  const researchRoutes = researchTopics.map((entry) => ({
    url: `${SITE_URL}/research/${entry.slug}`,
    lastModified: new Date(),
  }));

  const missionRoutes = missionTopics.map((entry) => ({
    url: `${SITE_URL}/mission/${entry.slug}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...postRoutes,
    ...simulationRoutes,
    ...courseRoutes,
    ...textbookRoutes,
    ...teacherToolRoutes,
    ...studentRoutes,
    ...teachingLabRoutes,
    ...researchRoutes,
    ...missionRoutes,
  ];
}
