import { getLocalizedPath } from '@/i18n/routing';

const DEFAULT_AUTH_REDIRECT_PATH = '/profile';

export const isSafeAuthRedirectPath = (
  path: string | null | undefined
): path is string => {
  if (!path) return false;

  return path.startsWith('/') && !path.startsWith('//');
};

export const getPostAuthRedirectPath = (
  path: string | null | undefined,
  locale: string
) => {
  if (!isSafeAuthRedirectPath(path)) {
    return getLocalizedPath(DEFAULT_AUTH_REDIRECT_PATH, locale);
  }

  return getLocalizedPath(path, locale);
};

export const getSignInPathWithNext = (nextPath: string, locale: string) => {
  const safeNextPath = getPostAuthRedirectPath(nextPath, locale);
  const encodedNextPath = encodeURIComponent(safeNextPath);

  return getLocalizedPath(`/sign-in?next=${encodedNextPath}`, locale);
};
