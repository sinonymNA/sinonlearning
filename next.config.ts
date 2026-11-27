import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  turbopack: { resolveAlias: { fs: { browser: "./lib/pacer/emptyModule.js" }, path: { browser: "./lib/pacer/emptyModule.js" }, crypto: { browser: "./lib/pacer/emptyModule.js" } } }, // Piper (HD voice) ships emscripten glue that mentions Node modules
  async redirects() {
    return [
      { source: "/teacher-tools", destination: "/teachers", permanent: true },
      { source: "/teacher-tools/:path*", destination: "/teachers", permanent: true },
      { source: "/teaching-lab", destination: "/teachers", permanent: true },
      { source: "/teaching-lab/:path*", destination: "/teachers", permanent: true },
      { source: "/classboard", destination: "/dash", permanent: true },
      { source: "/arcade/catgrid", destination: "/arcade/meowdoku", permanent: true },   // the game was first called Cat Grid
    ];
  },
};

export default nextConfig;
