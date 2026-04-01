/**
 * Base URL for server-side API calls (RSC, generateMetadata, etc.).
 * In Docker Compose, set INTERNAL_API_URL=http://backend:4000 so the Next.js
 * container reaches the API on the internal network. The browser still uses
 * NEXT_PUBLIC_API_URL for axios and absolute asset URLs.
 */
export function getServerApiBaseUrl(): string {
  const raw =
    process.env.INTERNAL_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000';
  return raw.replace(/\/$/, '');
}
