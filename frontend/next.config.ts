import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // Disable the floating dev overlay
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
