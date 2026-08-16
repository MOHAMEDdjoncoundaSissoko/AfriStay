import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  allowedDevOrigins: ['http://192.168.1.161:3000'], // <-- Ligne ajoutée pour le téléphone
};

export default nextConfig;