import { AUTH_COOKIE_NAMES } from './auth-routing';

type CookieReader = {
  has: (name: string) => boolean;
};

export const hasAuthSessionCookie = (cookies: CookieReader) =>
  AUTH_COOKIE_NAMES.some((cookieName) => cookies.has(cookieName));
