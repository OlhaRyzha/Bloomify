export const AUTH_SESSION_COOKIE_NAME = 'bloomify_session';
export const AUTH_COOKIE_NAMES = [AUTH_SESSION_COOKIE_NAME] as const;

export const isProtectedAuthPath = (pathname: string) =>
  pathname === '/profile' || pathname.startsWith('/profile/');
