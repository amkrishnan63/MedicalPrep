import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Turbopack was resolving the wrong root ("Next.js package not found"),
  // which broke HMR and produced hydration mismatches on /login.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
