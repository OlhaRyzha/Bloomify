import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function PlanCardSkeleton() {
  return (
    <Card className='relative overflow-hidden'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-12 w-12 rounded-xl' />
            <div className='space-y-2'>
              <Skeleton className='h-5 w-24 rounded-lg' />
              <Skeleton className='h-3 w-36 rounded-lg' />
            </div>
          </div>
          <div className='text-right space-y-1'>
            <Skeleton className='h-8 w-20 rounded-lg' />
            <Skeleton className='h-3 w-12 rounded-lg ml-auto' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Skeleton className='h-9 w-full rounded-lg' />
      </CardContent>
    </Card>
  );
}
