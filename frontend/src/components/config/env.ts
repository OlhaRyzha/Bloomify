// Local development uses the standalone Django server. Vercel Services mount
// the backend under `/api` on the same deployment domain.
export const DEFAULT_BASE_URL =
  process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL;
export const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_HOST || BASE_URL;
export const TELEGRAM_BOT_URL = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || '';
export const AUTH0_DOMAIN = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '';
export const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '';
export const AUTH0_AUDIENCE = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '';
