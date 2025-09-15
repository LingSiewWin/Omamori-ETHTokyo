/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Output file tracing root to resolve lockfile warning
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;