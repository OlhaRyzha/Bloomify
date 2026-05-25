'use client';

import {
  AlertTriangle,
  Info,
  type LucideIcon,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ConfirmationTone = 'danger' | 'info' | 'warning';

type ConfirmationDialogProps = {
  open: boolean;
  tone?: ConfirmationTone;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
};

const toneStyles: Record<
  ConfirmationTone,
  {
    icon: LucideIcon;
    iconClassName: string;
    confirmVariant: 'default' | 'destructive' | 'secondary';
  }
> = {
  danger: {
    icon: ShieldAlert,
    iconClassName: 'bg-destructive/10 text-destructive',
    confirmVariant: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'bg-amber-100 text-amber-700',
    confirmVariant: 'default',
  },
  info: {
    icon: Info,
    iconClassName: 'bg-primary/10 text-primary',
    confirmVariant: 'default',
  },
};

export default function ConfirmationDialog({
  open,
  tone = 'danger',
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
  onOpenChange,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const styles = toneStyles[tone];
  const Icon = styles.icon;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 px-4 py-6 backdrop-blur-sm'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}>
      <section
        role='alertdialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className='w-full max-w-md rounded-3xl bg-background p-6 text-left shadow-2xl'>
        <div className='flex items-start gap-4'>
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-2xl',
              styles.iconClassName
            )}>
            <Icon
              className='h-5 w-5'
              aria-hidden
            />
          </span>

          <div className='min-w-0 flex-1 space-y-2'>
            <h2
              id={titleId}
              className='font-display text-xl font-semibold text-foreground'>
              {title}
            </h2>
            <p
              id={descriptionId}
              className='text-sm leading-6 text-muted-foreground'>
              {description}
            </p>
          </div>

          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            className='-mr-2 -mt-2'
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}>
            <X
              className='h-4 w-4'
              aria-hidden
            />
          </Button>
        </div>

        <div className='mt-6 grid gap-3 sm:grid-cols-2 sm:justify-end'>
          <Button
            ref={cancelButtonRef}
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type='button'
            variant={styles.confirmVariant}
            onClick={() => {
              void onConfirm();
              onOpenChange(false);
            }}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
