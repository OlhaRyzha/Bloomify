import { Skeleton } from '@/components/ui/skeleton';

export default function ProductSkeleton() {
  return (
    <div className='grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start'>
      <div className='relative aspect-square overflow-hidden rounded-3xl bg-gradient-card shadow-card'>
        <Skeleton className='h-full w-full' />
      </div>

      <div className='space-y-5'>
        <Skeleton className='h-5 w-28 rounded-full' />
        <Skeleton className='h-10 w-3/4 rounded-lg' />
        <Skeleton className='h-4 w-full rounded-lg' />
        <Skeleton className='h-4 w-5/6 rounded-lg' />
        <div className='flex flex-wrap items-center gap-4 pt-2'>
          <Skeleton className='h-10 w-28 rounded-lg' />
          <Skeleton className='h-12 w-36 rounded-full' />
        </div>
        <div className='grid gap-3 pt-2 md:grid-cols-2'>
          <Skeleton className='h-24 w-full rounded-2xl' />
          <Skeleton className='h-24 w-full rounded-2xl' />
        </div>
      </div>
    </div>
  );
}
