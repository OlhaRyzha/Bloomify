export const ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

export const ANALYTICS_PROVIDER =
  process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? 'noop';

export const isVercelAnalyticsEnabled =
  ANALYTICS_ENABLED && ANALYTICS_PROVIDER === 'vercel';
