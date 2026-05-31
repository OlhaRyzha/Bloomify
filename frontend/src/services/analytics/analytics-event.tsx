'use client';

import { useEffect, useRef } from 'react';

type AnalyticsEventProps = {
  dedupeKey?: string;
  enabled?: boolean;
  track: () => void;
};

export default function AnalyticsEvent({
  dedupeKey = 'default',
  enabled = true,
  track,
}: AnalyticsEventProps) {
  const trackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || trackedKeyRef.current === dedupeKey) {
      return;
    }

    trackedKeyRef.current = dedupeKey;
    track();
  }, [dedupeKey, enabled, track]);

  return null;
}
