import { isProduction } from '@/utils/guards/is-production';

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const sentryCommonOptions = {
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN) && process.env.NODE_ENV !== 'test',
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: isProduction ? 0.1 : 0,
  enableLogs: isProduction,
  sendDefaultPii: false,
};

export const sentryReplayOptions = {
  replaysSessionSampleRate: isProduction ? 0.01 : 0,
  replaysOnErrorSampleRate: isProduction ? 1.0 : 0,
};
