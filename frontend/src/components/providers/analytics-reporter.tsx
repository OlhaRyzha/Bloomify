'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

import { isVercelAnalyticsEnabled } from '@/services/analytics/analytics.config';

export default function AnalyticsReporter() {
  if (!isVercelAnalyticsEnabled) {
    return null;
  }

  return <VercelAnalytics />;
}
