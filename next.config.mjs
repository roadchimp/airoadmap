/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // REMOVED async rewrites() { ... } function
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://v0-ai-sherpas-demo-k8qburcbb-roadchimps-projects.vercel.app',
  },
};

export default nextConfig; 