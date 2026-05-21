import { cn } from '@/lib/utils';

type HomeSectionHeaderProps = {
  className?: string;
  description?: string;
  label: string;
  title: string;
};

export default function HomeSectionHeader({
  className,
  description,
  label,
  title,
}: HomeSectionHeaderProps) {
  return (
    <header className={cn('mb-16 text-center', className)}>
      <span className='mb-4 block text-sm font-medium uppercase tracking-widest text-primary'>
        {label}
      </span>
      <h2 className='font-display mb-4 text-4xl font-bold md:text-5xl'>
        {title}
      </h2>
      {description && (
        <p className='mx-auto max-w-3xl text-lg text-muted-foreground'>
          {description}
        </p>
      )}
    </header>
  );
}
