import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { getPublishedTextbooks } from "@/lib/textbooks";
import { simulations } from "@/data/simulations";
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

  const textbooks = await getPublishedTextbooks();
  const textbookRoutes = textbooks.map((book) => ({
    url: `${SITE_URL}/textbooks/${book.slug}`,
    lastModified: new Date(book.updated_at),
  }));

  return [...staticRoutes, ...postRoutes, ...simulationRoutes, ...textbookRoutes];
}
