'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

import { isVercelAnalyticsEnabled } from '@/services/analytics/analytics.config';
import { isAnalyticsExcludedVisitor } from '@/services/analytics/analytics.exclude';

export default function AnalyticsReporter() {
  if (!isVercelAnalyticsEnabled) {
    return null;
  }

  // Drop page views from excluded visitors (owner/testers by email) so the
  // dashboard reflects real visitors only.
  return (
    <VercelAnalytics
      beforeSend={(event) => (isAnalyticsExcludedVisitor() ? null : event)}
    />
  );
}
