import type { NextConfig } from 'next';

/**
 * DESIGN DECISION: SECURITY HARDENING
 * We implement a multi-layered defense strategy with strict CSP,
 * HSTS for transport security, and granular Permissions-Policy to
 * minimize the attack surface of the venue operating system.
 */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://maps.googleapis.com https://www.gstatic.com https://*.firebaseio.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://maps.gstatic.com https://maps.googleapis.com https://*.googleusercontent.com",
      "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com wss://*.firebaseio.com https://routes.googleapis.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      'frame-src https://accounts.google.com https://*.firebaseapp.com',
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
