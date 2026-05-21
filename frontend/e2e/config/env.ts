const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const frontendBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export const apiBaseUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.replace(/^\/+/, '');

  return `${apiBaseUrl}/${normalizedPath}`;
};
