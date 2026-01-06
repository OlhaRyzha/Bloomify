import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type InfoCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
};

export default function InfoCard({
  title,
  children,
  className,
  titleClassName,
}: InfoCardProps) {
  return (
    <div className={cn('rounded-2xl bg-muted/60 p-4', className)}>
      <p
        className={cn(
          'text-xs uppercase tracking-widest text-primary',
          titleClassName
        )}>
        {title}
      </p>
      <div className='mt-2 text-sm text-muted-foreground'>{children}</div>
    </div>
  );
}
