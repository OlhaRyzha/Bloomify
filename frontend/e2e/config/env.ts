import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const frontendBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';

export const apiBaseUrl = trimTrailingSlash(
  process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:8010'
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.replace(/^\/+/, '');

  return `${apiBaseUrl}/${normalizedPath}`;
};
