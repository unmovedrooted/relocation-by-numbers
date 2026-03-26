import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/mo",
        destination: "/best-states-for-fire/missouri",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;