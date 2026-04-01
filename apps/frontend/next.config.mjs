import { config as loadRootEnv } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadRootEnv({ path: resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
// Rewrites are resolved at build time: in Docker pass INTERNAL_API_URL=http://backend:4000 so the
// Next server proxies to the API over the compose network (not localhost:4000 inside the container).
const apiOrigin = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000'
).replace(/\/$/, '');

function hostnameFromBaseUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const remotePatterns = [
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: '*.cloudinary.com' },
  { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
  { protocol: 'http', hostname: 'localhost', pathname: '/**' },
  { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
];

const publicApiHost = hostnameFromBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? '');
if (publicApiHost) {
  remotePatterns.push({
    protocol: publicApiHost === 'localhost' || publicApiHost === '127.0.0.1' ? 'http' : 'https',
    hostname: publicApiHost,
    pathname: '/uploads/**',
  });
}

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
if (appDomain && appDomain !== 'localhost') {
  remotePatterns.push({ protocol: 'https', hostname: appDomain, pathname: '/uploads/**' });
  remotePatterns.push({ protocol: 'https', hostname: `*.${appDomain}`, pathname: '/**' });
}

const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    remotePatterns,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
      // Local disk uploads are served by the API; proxy so <img src="/uploads/..."> works on the storefront origin
      {
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
