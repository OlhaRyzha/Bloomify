import { isString } from '../guards/is-string';

export const generatePageNumbers = (
  totalPages: number,
  currentPage: number
) => {
  const pages: (number | string)[] = [];
  const delta = 1;

  if (totalPages <= 1) return [];

  pages.push(1);

  const start = Math.max(2, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);

  if (start - 1 > 1) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (totalPages - end > 1) pages.push('...');

  if (totalPages > 1) pages.push(totalPages);

  return pages.filter(
    (page, index, arr) =>
      page !== arr[index + 1] && (isString(page) || page <= totalPages)
  );
};
