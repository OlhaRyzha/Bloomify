import type { useAuthTokenStore } from './auth-token.store';

type AuthTokenStore = ReturnType<typeof useAuthTokenStore.getState>;

export const selectAccessToken = (state: AuthTokenStore) => state.accessToken;
export const selectSetAccessToken = (state: AuthTokenStore) =>
  state.setAccessToken;
export const selectClearAccessToken = (state: AuthTokenStore) =>
  state.clearAccessToken;
