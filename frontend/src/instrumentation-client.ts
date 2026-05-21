// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
  sentryCommonOptions,
  sentryReplayOptions,
} from '@/config/sentry';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  ...sentryCommonOptions,
  ...sentryReplayOptions,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
