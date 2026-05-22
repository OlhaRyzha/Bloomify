import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type SurfacePanelElement = 'aside' | 'div' | 'section';

type SurfacePanelProps = HTMLAttributes<HTMLElement> & {
  as?: SurfacePanelElement;
};

export default function SurfacePanel({
  as: Component = 'section',
  className,
  ...props
}: SurfacePanelProps) {
  return (
    <Component
      className={cn('rounded-3xl bg-gradient-card p-6 shadow-card', className)}
      {...props}
    />
  );
}
