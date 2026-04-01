/**
 * CORS: explicit origins from CORS_ORIGIN plus any https?://*.APP_DOMAIN (storefront subdomains).
 */
export function createCorsOriginCallback(
  corsOriginEnv: string | undefined,
  appDomainEnv: string | undefined,
): (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => void {
  const explicit = new Set(
    (corsOriginEnv ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const appDomain = appDomainEnv?.trim().toLowerCase().replace(/^www\./, '') ?? '';

  function matchesAppDomain(origin: string): boolean {
    if (!appDomain) return false;
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      return false;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    const host = url.hostname.toLowerCase();
    return host === appDomain || host === `www.${appDomain}` || host.endsWith(`.${appDomain}`);
  }

  return (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    if (explicit.has(origin)) {
      cb(null, true);
      return;
    }
    if (matchesAppDomain(origin)) {
      cb(null, true);
      return;
    }
    cb(null, false);
  };
}
