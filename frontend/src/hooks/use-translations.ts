'use client';

import { useLocale } from '@/components/providers/locale-provider';

export default function useTranslations() {
  const { dictionary } = useLocale();

  // Temporary compatibility layer for existing object-style translation access.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dictionary as any;
}
