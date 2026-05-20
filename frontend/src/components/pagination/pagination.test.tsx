import { screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { PaginationContainer } from './pagination';

const items = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

describe('PaginationContainer', () => {
  test('renders visible page range with current page semantics', () => {
    renderWithProviders(
      <PaginationContainer
        items={items}
        page={2}
        pageSize={5}
        onPageChange={vi.fn()}
        renderPage={(pageItems) => (
          <ul>
            {pageItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      />
    );

    expect(screen.getByText('Item 6')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
  });

  test('marks previous and next controls disabled at pagination edges', () => {
    const { rerender } = renderWithProviders(
      <PaginationContainer
        items={items}
        page={1}
        pageSize={5}
        onPageChange={vi.fn()}
        renderPage={() => null}
      />
    );

    expect(screen.getByRole('link', { name: /previous page/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByRole('link', { name: /next page/i })).toHaveAttribute(
      'aria-disabled',
      'false'
    );

    rerender(
      <PaginationContainer
        items={items}
        page={3}
        pageSize={5}
        onPageChange={vi.fn()}
        renderPage={() => null}
      />
    );

    expect(screen.getByRole('link', { name: /next page/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('calls controlled page change without leaving valid page range', async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(
      <PaginationContainer
        items={items}
        page={1}
        pageSize={5}
        onPageChange={onPageChange}
        renderPage={() => null}
      />
    );

    await user.click(screen.getByRole('link', { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole('link', { name: /previous page/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
