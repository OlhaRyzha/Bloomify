export default function OrderCardSkeleton() {
  return (
    <article className='rounded-3xl border border-border bg-card p-5 shadow-card'>
      <div className='flex flex-col gap-5 md:flex-row md:items-start md:justify-between'>
        <div className='flex min-w-0 gap-4'>
          <div className='h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-muted' />

          <div className='min-w-0 flex-1 space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='h-5 w-32 animate-pulse rounded-full bg-muted' />
              <div className='h-6 w-24 animate-pulse rounded-full bg-muted' />
            </div>

            <div className='h-4 w-40 animate-pulse rounded-full bg-muted' />

            <div className='space-y-2 pt-2'>
              <div className='h-5 w-48 animate-pulse rounded-full bg-muted' />
              <div className='h-4 w-28 animate-pulse rounded-full bg-muted' />
            </div>
          </div>
        </div>

        <div className='space-y-2 md:text-right'>
          <div className='h-6 w-24 animate-pulse rounded-full bg-muted md:ml-auto' />
          <div className='h-4 w-32 animate-pulse rounded-full bg-muted md:ml-auto' />
          <div className='h-4 w-28 animate-pulse rounded-full bg-muted md:ml-auto' />
        </div>
      </div>
    </article>
  );
}
