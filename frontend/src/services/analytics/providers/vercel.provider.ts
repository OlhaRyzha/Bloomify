import { track } from '@vercel/analytics';

import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsProvider,
} from '../analytics.types';
import { isAnalyticsExcludedVisitor } from '../analytics.exclude';
import { isArray } from '@/utils/guards/is-array';
import { isBoolean } from '@/utils/guards/is-boolean';
import { isNumber } from '@/utils/guards/is-number';
import { isObject } from '@/utils/guards/is-object';
import { isString } from '@/utils/guards/is-string';

type VercelAnalyticsValue = string | number | boolean | null;

const flattenPayload = (
  payload: unknown,
  prefix = ''
): Record<string, VercelAnalyticsValue> => {
  if (payload === null) {
    return prefix ? { [prefix]: null } : {};
  }

  if (isString(payload) || isNumber(payload) || isBoolean(payload)) {
    return prefix ? { [prefix]: payload } : {};
  }

  if (isArray(payload)) {
    return payload.reduce<Record<string, VercelAnalyticsValue>>(
      (acc, item, index) => ({
        ...acc,
        ...flattenPayload(item, `${prefix}${prefix ? '_' : ''}${index}`),
      }),
      {}
    );
  }

  if (isObject(payload)) {
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
    if (isAnalyticsExcludedVisitor()) {
      return;
    }

    track(name, flattenPayload(payload));
  },
};
