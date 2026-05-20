import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BASE_URL } from '@/components/config/env';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/msw/server';

import LocaleSwitcher from './locale-switcher';

const replaceMock = vi.fn();
const refreshMock = vi.fn();
let pathnameMock = '/uk/catalog';
let searchParamsMock = new URLSearchParams('tag=classic&page=2');

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock,
  useRouter: () => ({
    refresh: refreshMock,
    replace: replaceMock,
  }),
  useSearchParams: () => searchParamsMock,
}));

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
    pathnameMock = '/uk/catalog';
    searchParamsMock = new URLSearchParams('tag=classic&page=2');
    window.history.pushState({}, '', '/uk/catalog?tag=classic&page=2#contact');

    server.use(
      http.get(`${BASE_URL}/site/languages`, () =>
        HttpResponse.json({ enabledLocales: ['uk', 'en', 'pl'] })
      )
    );
  });

  test('keeps current path, query, and hash when switching locale', async () => {
    const { user } = renderWithProviders(<LocaleSwitcher />, { locale: 'uk' });

    await user.click(screen.getByRole('combobox', { name: /вибрати мову/i }));
    await user.click(await screen.findByRole('option', { name: /polski/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        '/pl/catalog?tag=classic&page=2#contact'
      );
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
