import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these security headers to all routes
        source: "/(.*)",
        headers: [
          {
            // Prevents clickjacking by blocking the site from being embedded in iframes
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Prevents the browser from guessing file types (MIME sniffing)
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Limits how much referrer information is sent to other websites
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Disables access to browser features that our application doesn't use
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;