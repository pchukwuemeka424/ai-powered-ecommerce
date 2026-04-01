/** Keep in sync with backend JWT_EXPIRES_IN (default 10y). */
export const AUTH_TOKEN_COOKIE_DAYS = 3650;

/** Auth JWT cookie: scoped to APP_DOMAIN so api.* and *.<domain> receive it over HTTPS. */
export function authTokenCookieAttrs(): {
  expires: number;
  sameSite: 'lax';
  secure?: boolean;
  domain?: string;
} {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim() ?? '';
  const isLocal = !appDomain || appDomain === 'localhost';

  const attrs: {
    expires: number;
    sameSite: 'lax';
    secure?: boolean;
    domain?: string;
  } = {
    expires: AUTH_TOKEN_COOKIE_DAYS,
    sameSite: 'lax',
  };

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (protocol === 'https:') attrs.secure = true;
    if (
      !isLocal &&
      (hostname === appDomain ||
        hostname === `www.${appDomain}` ||
        hostname.endsWith(`.${appDomain}`))
    ) {
      attrs.domain = `.${appDomain}`;
    }
  }

  return attrs;
}
