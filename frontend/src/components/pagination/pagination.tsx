'use client';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { generatePageNumbers } from '@/utils/pagination/generate-page-numbers';
import { ReactNode, useMemo, useState } from 'react';
import { isFunction } from '@/utils/guards/is-function';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PaginationContainerProps<T> = {
  items: T[];
  pageSize?: number;
  className?: string;
  renderPage: (pageItems: T[], page: number) => ReactNode;
  page?: number;
  onPageChange?: (page: number) => void;
  hideControls?: boolean;
  scrollToTopOnChange?: boolean;
  controlsRightContent?: ReactNode;
  controlsLeftContent?: ReactNode;
  showPageSizeControl?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (value: number) => void;
  showItemsCount?: boolean;
  itemsCount?: number;
  itemsCountPrefix?: string;
  itemsCountSuffix?: string;
};

export function PaginationContainer<T>({
  items,
  pageSize = 6,
  className,
  renderPage,
  page: controlledPage,
  onPageChange,
  hideControls,
  scrollToTopOnChange,
  controlsRightContent,
  controlsLeftContent,
  showPageSizeControl,
  pageSizeOptions,
  onPageSizeChange,
  showItemsCount,
  itemsCount,
  itemsCountPrefix = 'Items',
  itemsCountSuffix = 'total',
}: PaginationContainerProps<T>) {
  const isControlled = controlledPage && isFunction(onPageChange);
  const [uncontrolledPage, setUncontrolledPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const rawPage = isControlled ? controlledPage ?? 1 : uncontrolledPage;
  const page = Math.min(totalPages, Math.max(1, rawPage));

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const pageItems = useMemo(() => items.slice(start, end), [items, start, end]);

  const goTo = (n: number) => {
    const next = Math.min(totalPages, Math.max(1, n));
    if (isControlled) {
      onPageChange?.(next);
    } else {
      setUncontrolledPage(next);
    }

    if (scrollToTopOnChange && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pages = generatePageNumbers(totalPages, page);

  return (
    <div className={cn('w-full', className)}>
      {renderPage(pageItems, page)}
      {!hideControls && totalPages > 1 && (
        <div className='mt-10 flex items-center justify-between'>
          {showItemsCount ? (
            <p className='font-semibold text-sm text-muted-foreground text-nowrap '>
              {itemsCountPrefix} <b> {itemsCount ?? items.length}</b>{' '}
              {itemsCountSuffix}
            </p>
          ) : (
            controlsLeftContent
          )}

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(page - 1);
                  }}
                  className={cn(page === 1 && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>

              {pages.map((p, idx) =>
                typeof p === 'string' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href='#'
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault();
                        goTo(p);
                      }}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(page + 1);
                  }}
                  className={cn(
                    page === totalPages && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className=''>
            {showPageSizeControl && pageSizeOptions?.length ? (
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  onPageSizeChange?.(Number(value));
                }}>
                <SelectTrigger
                  chevronDownIconClassName='stroke-white'
                  className='h-10 min-w-[60px] justify-between rounded-md border border-border bg-primary px-2 text-sm font-semibold text-white shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20'>
                  <SelectValue placeholder={`${pageSize} / page`} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={String(option)}>
                      {option} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {controlsRightContent}
          </div>
        </div>
      )}
    </div>
  );
}
