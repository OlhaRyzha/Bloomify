import nextEnv from '@next/env';

import { DEFAULT_BASE_URL } from '../../src/components/config/env';

nextEnv.loadEnvConfig(process.cwd());

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const frontendBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export const apiBaseUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.replace(/^\/+/, '');

  return `${apiBaseUrl}/${normalizedPath}`;
};
