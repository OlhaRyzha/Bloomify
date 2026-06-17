import { track } from '@vercel/analytics';

import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsProvider,
} from '../analytics.types';
import { isAnalyticsOptedOut } from '../analytics.opt-out';

type VercelAnalyticsValue = string | number | boolean | null;

const flattenPayload = (
  payload: unknown,
  prefix = ''
): Record<string, VercelAnalyticsValue> => {
  if (payload === null) {
    return prefix ? { [prefix]: null } : {};
  }

  if (
    typeof payload === 'string' ||
    typeof payload === 'number' ||
    typeof payload === 'boolean'
  ) {
    return prefix ? { [prefix]: payload } : {};
  }

  if (Array.isArray(payload)) {
    return payload.reduce<Record<string, VercelAnalyticsValue>>(
      (acc, item, index) => ({
        ...acc,
        ...flattenPayload(item, `${prefix}${prefix ? '_' : ''}${index}`),
      }),
      {}
    );
  }

  if (typeof payload === 'object' && payload) {
    return Object.entries(payload).reduce<Record<string, VercelAnalyticsValue>>(
      (acc, [key, value]) => {
        const nextPrefix = prefix ? `${prefix}_${key}` : key;
        return {
          ...acc,
          ...flattenPayload(value, nextPrefix),
        };
      },
      {}
    );
  }

  return {};
};

export const vercelAnalyticsProvider: AnalyticsProvider = {
  track: <TName extends AnalyticsEventName>(
    name: TName,
    payload: AnalyticsEventPayload<TName>
  ) => {
    if (isAnalyticsOptedOut()) {
      return;
    }

    track(name, flattenPayload(payload));
  },
};
