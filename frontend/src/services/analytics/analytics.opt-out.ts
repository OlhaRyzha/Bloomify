const OPT_OUT_KEY = 'bloomify-analytics-opt-out';

export const isAnalyticsOptedOut = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
};

export const setAnalyticsOptOut = (optedOut: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (optedOut) {
      window.localStorage.setItem(OPT_OUT_KEY, '1');
    } else {
      window.localStorage.removeItem(OPT_OUT_KEY);
    }
  } catch {
    // Ignore storage errors (private mode, disabled storage, etc.).
  }
};
