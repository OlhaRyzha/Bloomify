import { AUTH_SESSION_COOKIE_NAME } from './auth-routing';

const AUTH_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const setAuthSessionCookie = () => {
  document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; Path=/; Max-Age=${AUTH_SESSION_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

export const clearAuthSessionCookie = () => {
  document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
};
