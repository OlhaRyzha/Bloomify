import type { ComponentType, ReactNode, FC } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type WithSkeletonOptions = {
  skeleton?: ReactNode;
  skeletonClassName?: string;
};

type LoadingProps<P> =
  | ({ loading: true; skeletonClassName?: string } & Partial<P>)
  | ({ loading?: false; skeletonClassName?: string } & P);

export const withSkeleton = <P extends object>(
  Component: ComponentType<P>,
  { skeleton, skeletonClassName }: WithSkeletonOptions = {}
): ComponentType<LoadingProps<P>> => {
  const Wrapped: FC<LoadingProps<P>> = (props) => {
    const { loading, skeletonClassName: override, ...rest } = props;

    if (loading) {
      if (skeleton) {
        return <>{skeleton}</>;
      }

      return (
        <Skeleton className={cn(skeletonClassName, override)} />
      );
    }

    return <Component {...(rest as P)} />;
  };

  Wrapped.displayName = `WithSkeleton(${Component.displayName ?? Component.name ?? 'Component'})`;

  return Wrapped;
};
