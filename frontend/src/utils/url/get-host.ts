import { invariant } from '@/utils/invariant/invariant';

export const getHost = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    invariant(false, `Invalid URL: ${url}`);
  }
};
