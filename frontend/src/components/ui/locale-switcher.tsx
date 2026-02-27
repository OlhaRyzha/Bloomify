'use client';

import { Globe } from 'lucide-react';
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

type LocaleSwitcherProps = {
  className?: string;
};

export default function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

  return (
    <div className={cn('inline-flex', className)}>
      <span className='sr-only'>{t('locale_switcherLabel')}</span>

      <Select
        value={locale}
        onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger
          size='sm'
          className='h-9 rounded-full border-border/70 bg-card px-3 text-xs font-semibold text-foreground shadow-soft hover:bg-muted/60'
          aria-label={t('locale_switcherAria')}>
          <div className='flex items-center gap-2'>
            <Globe className='h-3.5 w-3.5 text-primary' />
            <span className='tracking-[0.08em]'>{localeShortLabels[locale]}</span>
          </div>
        </SelectTrigger>

        <SelectContent
          align='end'
          position='popper'
          className='min-w-40'>
          {supportedLocales.map((loc) => (
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
