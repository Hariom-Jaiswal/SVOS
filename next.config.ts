import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Firebase Auth popup needs apis.google.com + gstatic.com
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://maps.googleapis.com https://www.gstatic.com https://*.firebaseio.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Firebase Auth profile pictures + Maps tiles
      "img-src 'self' data: blob: https://maps.gstatic.com https://maps.googleapis.com https://*.googleusercontent.com",
      // Firebase Auth OAuth token exchange + Realtime DB websockets
      "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com wss://*.firebaseio.com https://routes.googleapis.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Firebase Auth uses iframes on accounts.google.com and *.firebaseapp.com
      'frame-src https://accounts.google.com https://*.firebaseapp.com',
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
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
