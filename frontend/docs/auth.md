# Auth Architecture

Bloomify auth is currently frontend-ready and backend-contract driven. The
frontend should be prepared for Django auth without pretending to own long-lived
credentials.

## Token Boundary

- Keep the access token in memory only through `auth-token.store`.
- Do not persist access or refresh tokens to `localStorage`, `sessionStorage`,
  Zustand persist, IndexedDB, or URL params.
- The future refresh token should be issued by Django as an `HttpOnly`,
  `Secure`, `SameSite` cookie.
- The frontend may keep a non-sensitive session marker cookie only for route
  guards that need to run before client hydration.

Current marker:

- `bloomify_session` is set by `auth-session-cookie.ts`.
- It stores no token value and only indicates that the user has completed an
  auth flow.

## Client Flow

Sign-in and sign-up forms should:

1. Submit through `AuthSessionService`.
2. Let `AuthService` validate the token response with `authTokenResponseSchema`.
3. Let `AuthSessionService` start the client session.
4. Redirect with `getPostAuthRedirectPath`.

Do not set cookies, mutate token stores, or parse token responses directly in
forms. Keep those responsibilities in the auth feature helpers.

Use `AuthService` only for raw API calls. Use `AuthSessionService` when a flow
must update client auth state.

## Access Token Refresh

`ApiClient` refreshes the in-memory access token after a 401 response from
normal app API requests:

- it calls `auth/refresh/` with credentials so Django can read the future
  `HttpOnly` refresh cookie
- it retries the original request once with the fresh access token
- it does not refresh sign-in, sign-up, refresh, or logout requests
- it clears the in-memory access token and `bloomify_session` marker if refresh
  fails

Do not call `AuthSessionService` from `ApiClient`. `AuthService` already uses
the shared `apiClient`, so importing the session service there would create a
cycle. Keep refresh parsing inside `ApiClient` or move it to a helper that does
not import `apiClient`.

## Redirect Safety

All `next` redirects must pass through `auth-redirect.ts`.

Allowed:

- relative app paths such as `/profile`
- localized relative paths such as `/uk/profile`
- relative paths with query strings such as `/checkout?step=payment`

Rejected:

- absolute external URLs
- protocol-relative URLs such as `//example.com`
- empty values

Unsafe values fall back to the localized `/profile` route.

## Route Guards

The `proxy.ts` guard protects localized profile routes before the request is
rewritten. Server routes such as `profile/page.tsx` should use
`hasAuthSessionCookie` so server rendering and proxy behavior share the same
cookie contract.

Server-rendered protected routes should use `hasAuthSessionCookie`.

Global shared UI such as the header should not call `cookies()` just to switch a
non-critical account link because that can make otherwise static routes dynamic.
For that case, client components may read only the non-sensitive
`bloomify_session` marker after hydration through `useAuthSessionMarker`.

The guard is not an authorization source of truth. Django must still validate
the real session/refresh cookie for protected API endpoints.

## Future Django Contract

Expected endpoints are centralized in `API_ROUTES`:

- `auth/token/` for sign-in
- `auth/register/` for sign-up
- `auth/refresh/` for access-token refresh
- `auth/logout/` for session cleanup
- `auth/me/` for current user/profile data

When Django auth is implemented, the frontend should add:

- logout flow that clears the in-memory access token and session marker cookie
- profile data query backed by `auth/me/`
- backend contract tests for refresh-cookie behavior
