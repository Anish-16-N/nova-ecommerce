/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Powered-By', value: 'Next.js/14.2-Vulnerable-Demo' },
          { key: 'X-Backend-DB', value: 'PostgreSQL-Raw-Query-Mode' },
          { key: 'X-Recon-Hint', value: 'Check /robots.txt, /sitemap.xml, and /api/debug/env' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Session-ID, X-Nova-Vuln' },
        ],
      },
    ];
  },
};

export default nextConfig;

