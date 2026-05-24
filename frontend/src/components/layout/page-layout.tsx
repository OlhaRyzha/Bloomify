import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';
import SectionHeader from '@/components/ui/section-header';

type ContainerSize = 'sm' | 'lg';

const containerSizeClassName: Record<ContainerSize, string> = {
  sm: 'max-w-4xl',
  lg: 'max-w-8/10',
};

type ContainerProps = ComponentPropsWithoutRef<'div'> & {
  size?: ContainerSize;
};

export function Container({
  className,
  size = 'lg',
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn('mx-auto px-4', containerSizeClassName[size], className)}
      {...props}
    />
  );
}

type PageSectionProps = ComponentPropsWithoutRef<'section'>;

export function PageSection({ className, ...props }: PageSectionProps) {
  return (
    <section
      className={cn('bg-background pb-16 pt-28', className)}
      {...props}
    />
  );
}

type PageHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
};

export function PageHeader({
  label,
  title,
  description,
  align = 'center',
}: PageHeaderProps) {
  return (
    <SectionHeader
      label={label}
      title={title}
      description={description}
      align={align}
    />
  );
}

type PageShellProps = ComponentPropsWithoutRef<'section'> & {
  containerClassName?: string;
  containerSize?: ContainerSize;
  header?: PageHeaderProps;
};

export function PageShell({
  children,
  className,
  containerClassName,
  containerSize,
  header,
  ...props
}: PageShellProps) {
  return (
    <PageSection
      className={className}
      {...props}>
      <Container
        size={containerSize}
        className={containerClassName}>
        {header && <PageHeader {...header} />}
        {children}
      </Container>
    </PageSection>
  );
}
