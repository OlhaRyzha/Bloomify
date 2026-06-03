'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './button';

type FeedbackStateTone = 'neutral' | 'error';

type FeedbackStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void | Promise<void>;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  tone?: FeedbackStateTone;
  className?: string;
  children?: ReactNode;
};

const toneClassName: Record<FeedbackStateTone, string> = {
  neutral: 'border-border bg-card/70',
  error: 'border-destructive/20 bg-destructive/10',
};

const iconClassName: Record<FeedbackStateTone, string> = {
  neutral: 'bg-primary/10 text-primary',
  error: 'bg-destructive/10 text-destructive',
};

export default function FeedbackState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionHref,
  secondaryActionLabel,
  tone = 'neutral',
  className,
  children,
}: FeedbackStateProps) {
  const Icon = tone === 'error' ? AlertTriangle : Inbox;
  const role = tone === 'error' ? 'alert' : 'status';
  const hasAction = actionLabel && (actionHref || onAction);
  const hasSecondaryAction = secondaryActionLabel && secondaryActionHref;

  return (
    <section
      role={role}
      className={cn(
        'rounded-2xl border p-8 text-center shadow-sm',
        toneClassName[tone],
        className
      )}>
      <div
        className={cn(
          'mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full',
          iconClassName[tone]
        )}>
        <Icon
          className='h-5 w-5'
          aria-hidden
        />
      </div>
      <h2
        className={cn(
          'font-display text-2xl font-semibold',
          tone === 'error' && 'text-destructive'
        )}>
        {title}
      </h2>
      <p className='mx-auto mt-2 max-w-xl text-sm text-muted-foreground'>
        {description}
      </p>
      {children ? <div className='mt-5'>{children}</div> : null}

      {hasAction || hasSecondaryAction ? (
        <div className='mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          {hasAction && actionHref ? (
            <Button
              asChild
              size='lg'>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : hasAction ? (
            <Button
              type='button'
              size='lg'
              variant={tone === 'error' ? 'destructive' : 'default'}
              onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}

          {hasSecondaryAction ? (
            <Button
              asChild
              size='lg'
              variant='outline'>
              <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
