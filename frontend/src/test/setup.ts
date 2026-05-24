import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

import { server } from './msw/server';

const createMemoryStorage = (): Storage => {
  let store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map<string, string>();
    },
    getItem(key) {
      return store.get(key) ?? null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
};

const testLocalStorage = createMemoryStorage();
const preventJsdomNavigation = (event: MouseEvent) => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const anchor = target.closest('a[href]');
  if (!anchor) return;

  event.preventDefault();
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: testLocalStorage,
});

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: testLocalStorage,
});

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(Element.prototype, 'hasPointerCapture', {
  configurable: true,
  writable: true,
  value: vi.fn(() => false),
});

Object.defineProperty(Element.prototype, 'setPointerCapture', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(Element.prototype, 'releasePointerCapture', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

beforeAll(() => {
  document.addEventListener('click', preventJsdomNavigation, true);
  server.listen({
    onUnhandledRequest: 'error',
  });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  document.removeEventListener('click', preventJsdomNavigation, true);
  server.close();
});
