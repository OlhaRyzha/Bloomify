'use client';

import { Globe } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  supportedLocales,
  localeLabels,
  localeShortLabels,
  type Locale,
} from '@/locales/translations';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { BASE_URL } from '@/components/config/env';
import { getLocalizedPath } from '@/i18n/routing';

type LocaleSwitcherProps = {
  className?: string;
};

export default function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const [enabledLocales, setEnabledLocales] =
    useState<Locale[]>(supportedLocales);

  useEffect(() => {
    let cancelled = false;

    fetch(`${BASE_URL}/site/languages`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          cancelled ||
          !data?.enabledLocales ||
          !Array.isArray(data.enabledLocales)
        ) {
          return;
        }

        const locales = data.enabledLocales.filter((loc: string) =>
          supportedLocales.includes(loc as Locale)
        ) as Locale[];

        if (locales.length > 0) {
          setEnabledLocales(locales);
        }
      })
      .catch(() => {
        // keep defaults if API is unavailable
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentLocale = useMemo(() => {
    return enabledLocales.includes(locale) ? locale : enabledLocales[0] || locale;
  }, [enabledLocales, locale]);

  useEffect(() => {
    if (currentLocale !== locale) {
      setLocale(currentLocale);
    }
  }, [currentLocale, locale, setLocale]);

  const handleLocaleChange = (value: string) => {
    const nextLocale = value as Locale;
    const query = searchParams.toString();
    const nextPath = getLocalizedPath(
      query ? `${pathname}?${query}` : pathname,
      nextLocale
    );

    setLocale(nextLocale);
    router.replace(nextPath);
    router.refresh();
  };

  return (
    <div className={cn('inline-flex', className)}>
      <span className='sr-only'>{t('locale_switcher_label')}</span>

      <Select
        value={currentLocale}
        onValueChange={handleLocaleChange}>
        <SelectTrigger
          size='sm'
          className='h-9 rounded-full border-border/70 bg-card px-3 text-xs font-semibold text-foreground shadow-soft hover:bg-muted/60'
          aria-label={t('locale_switcher_aria')}>
          <div className='flex items-center gap-2'>
            <Globe className='h-3.5 w-3.5 text-primary' />
            <span className='tracking-[0.08em]'>
              {localeShortLabels[currentLocale]}
            </span>
          </div>
        </SelectTrigger>

        <SelectContent
          align='end'
          position='popper'
          className='min-w-40'>
          {enabledLocales.map((loc) => (
            <SelectItem
              key={loc}
              value={loc}>
              <div className='flex w-full items-center justify-between gap-3'>
                <span>{localeLabels[loc]}</span>
                <span className='text-[11px] font-semibold uppercase text-muted-foreground'>
                  {localeShortLabels[loc]}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
