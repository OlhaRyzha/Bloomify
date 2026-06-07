import { Skeleton } from '@/components/ui/skeleton';
import SurfacePanel from '@/components/ui/surface-panel';
import CartItemSkeleton from './cart-item-skeleton';

type CartLoadingStateProps = {
  placeholders: number;
};

export default function CartLoadingState({ placeholders }: CartLoadingStateProps) {
  return (
    <div className='grid gap-10 lg:grid-cols-[1.6fr_0.9fr]'>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/60 px-6 py-4 text-sm text-muted-foreground'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-9 w-32 rounded-full' />
        </div>

        {Array.from({ length: placeholders }).map((_, idx) => (
          <CartItemSkeleton key={`cart-skeleton-${idx}`} />
        ))}

        <div className='rounded-2xl bg-muted/50 px-6 py-4 text-sm text-muted-foreground'>
          <Skeleton className='h-4 w-48' />
        </div>
      </div>

      <aside className='space-y-6'>
        <SurfacePanel
          as='div'
          className='space-y-4'>
          <Skeleton className='h-7 w-40' />
          <div className='space-y-3 pt-2'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-4 w-20' />
            </div>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-24' />
            </div>
          </div>
          <div className='border-t border-border pt-4'>
            <Skeleton className='h-6 w-28' />
          </div>
          <Skeleton className='h-11 w-full rounded-lg' />
          <Skeleton className='h-11 w-full rounded-lg' />
        </SurfacePanel>

        <div className='rounded-3xl bg-muted/60 p-5 space-y-4'>
          <Skeleton className='h-4 w-40' />
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Skeleton className='h-11 w-full rounded-lg' />
            <Skeleton className='h-11 w-full rounded-lg' />
          </div>
          <Skeleton className='h-3 w-56' />
        </div>

        <div className='grid gap-3'>
          <Skeleton className='h-20 w-full rounded-2xl' />
          <Skeleton className='h-20 w-full rounded-2xl' />
          <Skeleton className='h-20 w-full rounded-2xl' />
        </div>
      </aside>
    </div>
  );
}
