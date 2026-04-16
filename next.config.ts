import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/mo",
        destination: "/best-states-for-fire/missouri",
        permanent: true,
      },
      {
        source: "/cost-of-living-in/:cityId",
        destination: "/cost-of-living/:cityId",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;