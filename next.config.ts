import { WithPWA } from "next-pwa";
import nextPWA from "next-pwa";

const withPWA: WithPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  scope: '/',
  cacheId: 'alpha',
  cleanupOutdatedCaches: true,
});

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    optimizePackageImports: ["react-icons", "lucide-react"],
  },
};

export default withPWA(config);