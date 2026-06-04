import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import FeedbackState from './feedback-state';

describe('FeedbackState', () => {
  test('supports opening primary link in a new tab', () => {
    render(
      <FeedbackState
        title='Order created'
        description='Track your order in Telegram.'
        actionLabel='Subscribe to Telegram bot'
        actionHref='https://t.me/bloomify_support_bot?start=order_10'
        actionRel='noopener noreferrer'
        actionTarget='_blank'
      />
    );

    const link = screen.getByRole('link', {
      name: /subscribe to telegram bot/i,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://t.me/bloomify_support_bot?start=order_10'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
