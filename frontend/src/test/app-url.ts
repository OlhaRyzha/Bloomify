const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const APP_URL = trimTrailingSlash(
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
);

export const appUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${APP_URL}${normalizedPath}`;
};
