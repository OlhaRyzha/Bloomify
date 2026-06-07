const AUTH_RETURN_TO_STORAGE_KEY = 'bloomify_auth_return_to';

const isSafeInternalPath = (path: string) => path.startsWith('/');

export const rememberPostAuthRedirectPath = (path: string) => {
  if (!isSafeInternalPath(path)) {
    return;
  }

  window.sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, path);
};

export const getRememberedPostAuthRedirectPath = (fallbackPath: string) => {
  const storedPath = window.sessionStorage.getItem(AUTH_RETURN_TO_STORAGE_KEY);

  window.sessionStorage.removeItem(AUTH_RETURN_TO_STORAGE_KEY);

  if (!storedPath || !isSafeInternalPath(storedPath)) {
    return fallbackPath;
  }

  return storedPath;
};

export const navigateAfterAuth = (path: string) => {
  window.location.assign(path);
};
