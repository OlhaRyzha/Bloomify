import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAMES } from './auth-routing';

export const hasAuthSessionCookie = async (): Promise<boolean> => {
  const cookieStore = await cookies();

  return AUTH_COOKIE_NAMES.some((cookieName) =>
    Boolean(cookieStore.get(cookieName)?.value)
  );
};
