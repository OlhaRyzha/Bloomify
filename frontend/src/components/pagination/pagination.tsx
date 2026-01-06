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

type PaginationContainerProps<T> = {
  items: T[];
  pageSize?: number;
  className?: string;
  renderPage: (pageItems: T[], page: number) => ReactNode;
  page?: number;
  onPageChange?: (page: number) => void;
  hideControls?: boolean;
};

export function PaginationContainer<T>({
  items,
  pageSize = 6,
  className,
  renderPage,
  page: controlledPage,
  onPageChange,
  hideControls,
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
  };

  const pages = generatePageNumbers(totalPages, page);

  return (
    <div className={cn('w-full', className)}>
      {renderPage(pageItems, page)}
      {!hideControls && totalPages > 1 && (
        <Pagination className='mt-3'>
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
      )}
    </div>
  );
}
