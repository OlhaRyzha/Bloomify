'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function CartItemSkeleton() {
  return (
    <div className='flex flex-col gap-5 rounded-3xl bg-gradient-card p-5 shadow-card md:flex-row md:items-center'>
      <div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted md:h-28 md:w-28'>
        <Skeleton className='h-full w-full' />
      </div>

      <div className='flex-1 space-y-3'>
        <Skeleton className='h-3 w-16 rounded-full' />
        <Skeleton className='h-5 w-48 rounded-lg' />
        <Skeleton className='h-4 w-5/6 rounded-lg' />
      </div>

      <div className='flex items-center gap-3'>
        <Skeleton className='h-10 w-10 rounded-full' />
        <Skeleton className='h-10 w-10 rounded-full' />
        <Skeleton className='h-10 w-10 rounded-full' />
      </div>

      <div className='flex items-center justify-between gap-4 md:flex-col md:items-end'>
        <div className='text-right space-y-2'>
          <Skeleton className='h-3 w-12 rounded-full' />
          <Skeleton className='h-6 w-28 rounded-lg' />
          <Skeleton className='h-3 w-20 rounded-full' />
        </div>
        <Skeleton className='h-10 w-10 rounded-full' />
      </div>
    </div>
  );
}
