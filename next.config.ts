import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  // Point both Turbopack (dev) and Webpack (prod) at Phaser's UMD bundle,
  // which has a proper default export. The ESM build does not.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  turbopack: {
    resolveAlias: { phaser: "./node_modules/phaser/dist/phaser.js" },
  } as unknown as never,
  webpack(config: { resolve: { alias: Record<string, string> } }) {
    config.resolve.alias = {
      ...config.resolve.alias,
      phaser: require.resolve("phaser/dist/phaser.js"),
    };
    return config;
  },
  async redirects() {
    return [
      { source: "/teacher-tools", destination: "/teachers", permanent: true },
      { source: "/teacher-tools/:path*", destination: "/teachers", permanent: true },
      { source: "/teaching-lab", destination: "/teachers", permanent: true },
      { source: "/teaching-lab/:path*", destination: "/teachers", permanent: true },
      { source: "/classboard", destination: "/dash", permanent: true },
    ];
  },
};

export default nextConfig;
