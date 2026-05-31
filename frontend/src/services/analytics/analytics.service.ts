import { isVercelAnalyticsEnabled } from './analytics.config';
import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsProvider,
} from './analytics.types';
import { noopAnalyticsProvider } from './providers/noop.provider';
import { vercelAnalyticsProvider } from './providers/vercel.provider';

const analyticsProvider: AnalyticsProvider = isVercelAnalyticsEnabled
  ? vercelAnalyticsProvider
  : noopAnalyticsProvider;

const Analytics = {
  track: <TName extends AnalyticsEventName>(
    name: TName,
    payload: AnalyticsEventPayload<TName>
  ) => {
    analyticsProvider.track(name, payload);
  },
};

export default Analytics;
