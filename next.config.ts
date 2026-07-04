import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  async redirects() {
    return [
      { source: "/teacher-tools", destination: "/teachers", permanent: true },
      { source: "/teacher-tools/:path*", destination: "/teachers", permanent: true },
      { source: "/teaching-lab", destination: "/teachers", permanent: true },
      { source: "/teaching-lab/:path*", destination: "/teachers", permanent: true },
    ];
  },
};

export default nextConfig;
