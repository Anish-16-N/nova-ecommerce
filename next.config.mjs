/** @type {import('next').NextConfig} */

// Security response headers sent on every path.
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' data: https://images.unsplash.com; script-src 'self' 'unsafe-inline'; "
      + "style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'",
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Only the shop's own front end may call the API from a browser.
  { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' },
  { key: 'Vary', value: 'Origin' },
];

const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
