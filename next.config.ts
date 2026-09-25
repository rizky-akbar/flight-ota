import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_WHATSAPP_ADMIN: process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "6281234567890",
  },
};

export default nextConfig;
