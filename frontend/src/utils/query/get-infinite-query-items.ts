type PaginatedPage<TItem> = {
  items: TItem[];
};

export function getInfiniteQueryItems<TItem>(
  pages?: PaginatedPage<TItem>[]
): TItem[] {
  return pages?.flatMap((page) => page.items) ?? [];
}
