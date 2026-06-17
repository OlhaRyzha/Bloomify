'use client';

import { useEffect, useState } from 'react';

const DEFAULT_DELAY_MS = 250;

/**
 * Returns `true` only after `active` has stayed `true` for `delayMs`.
 * Used to defer loading indicators so fast operations don't flash a spinner
 * on screen — if the work finishes before the delay, the indicator never shows.
 */
export function useDelayedFlag(
  active: boolean,
  delayMs: number = DEFAULT_DELAY_MS
): boolean {
  const [visible, setVisible] = useState(false);
  const [trackedActive, setTrackedActive] = useState(active);

  // Reset synchronously when the source flag turns off — React's recommended
  // "adjust state during render" pattern, avoiding a reset effect.
  if (active !== trackedActive) {
    setTrackedActive(active);
    if (!active && visible) {
      setVisible(false);
    }
  }

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return visible;
}
