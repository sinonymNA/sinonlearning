import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
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

  return [...staticRoutes, ...postRoutes, ...simulationRoutes];
}
