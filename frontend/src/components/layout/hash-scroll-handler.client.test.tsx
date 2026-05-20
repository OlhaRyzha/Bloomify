import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import HashScrollHandler from './hash-scroll-handler.client';

let pathnameMock = '/uk';

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock,
}));

const setLocation = (url: string) => {
  window.history.pushState({}, '', url);
};

describe('HashScrollHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathnameMock = '/uk';
    document.body.innerHTML = '';
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('scrolls to target on initial hash', () => {
    setLocation('/uk#contact');
    const target = document.createElement('section');
    const scrollIntoView = vi.fn();
    target.id = 'contact';
    target.scrollIntoView = scrollIntoView;
    document.body.append(target);

    render(<HashScrollHandler />);
    vi.runAllTimers();

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  test('scrolls after hashchange', () => {
    setLocation('/uk');
    const target = document.createElement('section');
    const scrollIntoView = vi.fn();
    target.id = 'about';
    target.scrollIntoView = scrollIntoView;
    document.body.append(target);

    render(<HashScrollHandler />);
    setLocation('/uk#about');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    vi.runAllTimers();

    expect(scrollIntoView).toHaveBeenCalled();
  });

  test('handles same-path hash link clicks and ignores external links', () => {
    setLocation('/uk');
    const target = document.createElement('section');
    const scrollIntoView = vi.fn();
    target.id = 'subscription';
    target.scrollIntoView = scrollIntoView;
    document.body.append(target);

    const internalLink = document.createElement('a');
    internalLink.href = `${window.location.origin}/uk#subscription`;
    internalLink.textContent = 'Subscription';
    internalLink.addEventListener('click', (event) => event.preventDefault());
    document.body.append(internalLink);

    const externalLink = document.createElement('a');
    externalLink.href = 'https://example.com/#subscription';
    externalLink.textContent = 'External';
    externalLink.addEventListener('click', (event) => event.preventDefault());
    document.body.append(externalLink);

    render(<HashScrollHandler />);

    fireEvent.click(externalLink);
    vi.runAllTimers();
    expect(scrollIntoView).not.toHaveBeenCalled();

    fireEvent.click(internalLink);
    vi.runAllTimers();
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
