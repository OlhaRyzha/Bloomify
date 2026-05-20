import { Skeleton } from '@/components/ui/skeleton';

function CheckoutFieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div>
      <Skeleton className='mb-2 h-4 w-28 rounded-lg' />
      <Skeleton className='h-11 w-full rounded-md' />
      {wide && <Skeleton className='mt-2 h-3 w-40 rounded-lg' />}
    </div>
  );
}

export default function CheckoutLoadingState() {
  return (
    <div className='grid gap-8 lg:grid-cols-[1.4fr_0.9fr]'>
      <div className='space-y-6'>
        <section className='space-y-5 rounded-3xl bg-gradient-card p-6 shadow-card'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-5 w-5 rounded-full' />
            <Skeleton className='h-8 w-48 rounded-lg' />
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <CheckoutFieldSkeleton />
            <CheckoutFieldSkeleton />
            <CheckoutFieldSkeleton />
            <CheckoutFieldSkeleton />
          </div>

          <CheckoutFieldSkeleton wide />
          <CheckoutFieldSkeleton />
        </section>

        <section className='space-y-5 rounded-3xl bg-gradient-card p-6 shadow-card'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-5 w-5 rounded-full' />
            <Skeleton className='h-8 w-44 rounded-lg' />
          </div>

          <div className='grid gap-3'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={`checkout-payment-skeleton-${index}`}
                className='h-20 w-full rounded-2xl'
              />
            ))}
          </div>
        </section>
      </div>

      <aside className='space-y-6'>
        <section className='rounded-3xl bg-gradient-card p-6 shadow-card'>
          <Skeleton className='h-8 w-40 rounded-lg' />

          <div className='mt-5 space-y-4'>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`checkout-summary-skeleton-${index}`}
                className='flex items-start justify-between gap-4'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-36 rounded-lg' />
                  <Skeleton className='h-3 w-24 rounded-lg' />
                </div>
                <Skeleton className='h-4 w-20 rounded-lg' />
              </div>
            ))}
          </div>

          <div className='mt-6 space-y-3 border-t border-border pt-5'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-28 rounded-lg' />
              <Skeleton className='h-4 w-20 rounded-lg' />
            </div>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-24 rounded-lg' />
              <Skeleton className='h-4 w-24 rounded-lg' />
            </div>
            <div className='flex items-center justify-between pt-2'>
              <Skeleton className='h-5 w-20 rounded-lg' />
              <Skeleton className='h-8 w-28 rounded-lg' />
            </div>
          </div>

          <Skeleton className='mt-6 h-11 w-full rounded-lg' />
          <Skeleton className='mt-4 h-4 w-56 rounded-lg' />
        </section>
      </aside>
    </div>
  );
}
