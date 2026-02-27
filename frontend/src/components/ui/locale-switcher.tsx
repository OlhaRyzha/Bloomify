'use client';

import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supportedLocales, localeLabels, localeShortLabels, type Locale } from '@/locales/translations';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type LocaleSwitcherProps = {
  className?: string;
};

export default function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center gap-2 text-sm font-semibold text-muted-foreground', className)}>
      <span className='sr-only'>{t('locale_switcherLabel')}</span>
      <Select
        value={locale}
        onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger
          size='sm'
          className='rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground'
          aria-label={t('locale_switcherAria')}>
          <div className='flex items-center gap-1'>
            <Globe className='size-4 text-primary-foreground' />
            <span>{localeShortLabels[locale]}</span>
          </div>
          <SelectValue className='sr-only' />
        </SelectTrigger>
        <SelectContent align='end' position='popper'>
          {supportedLocales.map((loc) => (
            <SelectItem
              key={loc}
              value={loc}>
              <div className='flex items-center justify-between gap-2'>
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
