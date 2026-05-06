import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogCardSkeleton() {
  return (
    <div className='flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-card shadow-card'>
      <div className='relative aspect-square overflow-hidden bg-white/30'>
        <Skeleton className='h-full w-full' />
      </div>
      <div className='flex flex-1 flex-col space-y-3 p-6'>
        <Skeleton className='h-4 w-20 rounded-full' />
        <Skeleton className='h-7 w-3/4 rounded-lg' />
        <Skeleton className='h-4 w-full rounded-lg' />
        <Skeleton className='h-4 w-5/6 rounded-lg' />
        <div className='mt-auto flex items-center justify-between pt-1'>
          <Skeleton className='h-6 w-24 rounded-lg' />
          <Skeleton className='h-9 w-24 rounded-full' />
        </div>
      </div>
    </div>
  );
}
