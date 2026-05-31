import type { AnalyticsProvider } from '../analytics.types';

export const noopAnalyticsProvider: AnalyticsProvider = {
  track: () => undefined,
};
