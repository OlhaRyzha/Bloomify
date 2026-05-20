import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type SectionHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  className?: string;
  align?: 'center' | 'left';
  labelClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  extra?: ReactNode;
};

export default function SectionHeader({
  label,
  title,
  description,
  className,
  align = 'center',
  labelClassName,
  titleClassName,
  descriptionClassName,
  extra,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-12',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}>
      {label && (
        <span
          className={cn(
            'mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground',
            labelClassName
          )}>
          {label}
        </span>
      )}
      <h1
        className={cn(
          'font-display mb-3 text-4xl font-bold md:text-5xl',
          titleClassName
        )}>
        {title}
      </h1>
      {description && (
        <p
          className={cn(
            'mx-auto max-w-6xl text-base text-muted-foreground md:text-lg',
            align === 'left' && 'mx-0',
            descriptionClassName
          )}>
          {description}
        </p>
      )}
      {extra && <div className='mt-6'>{extra}</div>}
    </div>
  );
}
