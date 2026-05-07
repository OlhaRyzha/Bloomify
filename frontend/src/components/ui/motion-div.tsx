'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';

export const MotionDiv = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  function MotionDiv({ initial, suppressHydrationWarning, ...props }, ref) {
    const isHydrated = useHydrated();

    return (
      <motion.div
        ref={ref}
        initial={isHydrated ? initial : false}
        suppressHydrationWarning={suppressHydrationWarning ?? true}
        {...props}
      />
    );
  }
);
