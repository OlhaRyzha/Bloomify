import * as React from 'react';

import { cn } from '@/lib/utils';

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'prefix' | 'suffix'
> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  wrapperClassName?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, prefix, suffix, wrapperClassName, ...props },
    ref
  ) => {
    return (
      <div className={cn('relative flex items-center', wrapperClassName)}>
        {prefix ? (
          <span className='pointer-events-none absolute left-3 text-muted-foreground'>
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          type={type}
          data-slot='input'
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            prefix && 'pl-10',
            suffix && 'pr-10',
            className
          )}
          {...props}
        />
        {suffix ? (
          <span className='pointer-events-none absolute right-3 text-muted-foreground'>
            {suffix}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
