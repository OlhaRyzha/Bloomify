'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

import { isVercelAnalyticsEnabled } from '@/services/analytics/analytics.config';
import { isAnalyticsOptedOut } from '@/services/analytics/analytics.opt-out';

export default function AnalyticsReporter() {
  if (!isVercelAnalyticsEnabled) {
    return null;
  }

  // Drop page views from opted-out browsers (owner/testers) so the dashboard
  // reflects real visitors only.
  return (
    <VercelAnalytics
      beforeSend={(event) => (isAnalyticsOptedOut() ? null : event)}
    />
  );
}
