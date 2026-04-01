const DEFAULT_API = 'http://localhost:4000';

/** Public API origin for uploads and axios (empty env → default). */
export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return DEFAULT_API;
}

/** If `s` is an absolute URL whose path is `/uploads/...`, return that path for rebasing. */
function uploadsPathFromAbsoluteUrl(s: string): string | null {
  try {
    const u = new URL(s);
    if (u.pathname.startsWith('/uploads/')) {
      return u.pathname + u.search + u.hash;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve stored path or external URL for images (logo, hero, uploads, CDN).
 * - `/uploads/...` → same-origin path (Next.js rewrites to the API) so logos work even when
 *   `NEXT_PUBLIC_API_URL` is wrong or only set on the server.
 * - Absolute `http(s)://…/uploads/…` → normalized to `/uploads/…` for the same reason.
 * - Blob / other https URLs → returned unchanged.
 */
export function assetUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) return '';
  const s = pathOrUrl.trim();
  if (!s) return '';

  if (s.startsWith('http://') || s.startsWith('https://')) {
    const uploadsPath = uploadsPathFromAbsoluteUrl(s);
    if (uploadsPath) {
      return uploadsPath;
    }
    return s;
  }

  const p = s.startsWith('/') ? s : `/${s}`;
  if (p.startsWith('/uploads/')) {
    return p;
  }
  return `${getPublicApiBaseUrl()}${p}`;
}

/**
 * Value to persist after `POST .../stores/:tenantId/upload`.
 * Prefer relative `/uploads/...` so assetUrl() always uses the current API origin (avoids
 * saving `http://127.0.0.1:4000/...` in DB while the app uses `localhost` or production URL).
 */
export function normalizeUploadStorageValue(
  path: string | undefined,
  url: string | undefined,
): string {
  const p = path?.trim() ?? '';
  if (p.startsWith('/uploads/')) return p;

  const primary = (url ?? p).trim();
  const fromPrimary = uploadsPathFromAbsoluteUrl(primary);
  if (fromPrimary) return fromPrimary;

  const fromPath = uploadsPathFromAbsoluteUrl(p);
  if (fromPath) return fromPath;

  return primary;
}
