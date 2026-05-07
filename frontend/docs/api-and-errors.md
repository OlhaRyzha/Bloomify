# API And Errors

Bloomify API code should have clear boundaries:

- `ApiClient` owns HTTP execution and safe request wrapping
- service functions call HTTP clients
- schemas validate response shapes
- query/mutation hooks own TanStack Query integration
- UI components render states and user actions
- errors are normalized into `ApiError`

## ApiClient

`ApiClient` is the only place that should wrap HTTP requests with `safeRequest` and `safeVoidRequest`.

Rules:

- Components must not call Axios directly.
- Services must not duplicate `safeRequest` around every request.
- `ApiClient` should return response data, not full Axios responses.
- `ApiClient` should own common request behavior: base URL, credentials, params cleanup, locale params, external host allowlist, and future auth headers/refresh handling.
- `deleteVoid` should be used for delete endpoints that return no meaningful body.
- Error toast behavior should be configurable through `SafeRequestOptions`; default API calls should stay silent and let hooks/components decide user feedback.

Target shape:

```ts
const silentRequestOptions: SafeRequestOptions = {
  showErrorToast: false,
};

public async get<TResponse>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  return safeRequest(
    this.request<TResponse>({ method: 'get', url, config }),
    silentRequestOptions
  );
}
```

## Service Layer

Feature service files live in the owning feature API folder, for example `src/features/catalog/api/products.service.ts`. Shared HTTP infrastructure stays in `src/services/api`.

Rules:

- Do not call Axios directly from components.
- Keep endpoint construction in service functions.
- Validate successful responses with Zod.
- Return typed domain data.
- Do not import React components from services.
- Do not put UI decisions in services.
- Do not wrap service calls in `safeRequest`; `ApiClient` already does it.
- Keep services boring: call `apiClient`, parse the response schema, return data.

Target shape:

```ts
const ProductsService = {
  getProductById: (id: string): Promise<ProductItem> =>
    apiClient
      .get<ProductItem>(`${API_ROUTES.PRODUCTS}/${id}`)
      .then((response) => parseResponseWithSchema(response, catalogItemSchema)),
};
```

## Schemas

Response schemas can live in `src/schemas` when they are shared across multiple domains. Feature-specific form schemas should live next to the owning form in `forms/`.

Rules:

- Every external API response used by UI should have a Zod schema.
- Schema names should match domain language.
- Export inferred types from schemas.
- Keep schema validation at the API boundary, not inside render components.

## Runtime Guards

Before writing a new inline runtime/type check, first look in `src/utils/guards`.

Rules:

- Reuse existing guards such as `isString`, `isBoolean`, `isObject`, or `isNonEmptyArray`.
- Add a shared guard when the check is reusable across files.
- Keep one-off inline checks only when they are truly local and unlikely to repeat.
- Avoid duplicating expressions like `typeof value === 'string'` in multiple components or helpers.

## ApiError

`ApiError` is the normalized error type for frontend API failures.

Use it to represent:

- validation errors
- unauthorized/forbidden errors
- not found errors
- network errors
- timeout errors
- server errors
- unknown errors

UI should read `error.userMessage` for user-facing feedback. Technical details should stay in logs, monitoring, or diagnostics.

## Error Display

Use the smallest useful feedback:

- field-level error for form field validation
- form-level error for submit failures
- inline error state for a section that failed to load
- toast for background mutations or non-blocking feedback
- full page error only when the whole route cannot recover

Do not show raw backend stack traces or raw unknown error objects to users.

## Toasts

Toasts are useful for:

- successful background action
- failed background mutation
- non-blocking warning

Avoid toasts for:

- primary form validation errors
- content that must be read before continuing
- errors where the user needs field-level guidance

## Current Standard

Request safety belongs in `ApiClient`. Schema validation belongs in services. User feedback belongs in query/mutation hooks or components.

Avoid moving toast calls into schema parsers or service functions. If a request should show a global toast automatically, pass explicit safe request options at the API client boundary or show it in the mutation hook.

## Recovery Rules

Error UI should answer:

- what failed
- whether the user can retry
- where they can go next
- whether their input was preserved

For 404 product detail, a route should show a useful not-found state and a link back to catalog.
