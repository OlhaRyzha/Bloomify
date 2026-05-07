# Forms

Bloomify form standard is Formik for form state and Zod for validation.

## Target Pattern

- Use Zod as the source of truth for validation.
- Use `validateWithZod` to connect Zod to Formik.
- Keep form schemas, field config, and initial values close to the owning form.
- In features, put form-related files in a `forms/` folder.
- Extract reusable field components only after duplication appears.

## File Ownership

Recommended structure for a larger form:

```text
src/features/checkout/
  checkout.types.ts
  checkout.constants.ts
  checkout.utils.ts
  forms/
    checkout-form.tsx
    checkout-form.config.ts
    checkout-form.schemas.ts
```

Do not create proxy `index.ts` files for this structure unless the feature intentionally exposes a stable public API.

## Zod Schemas

Schemas should:

- describe the API or form boundary exactly
- trim user-entered strings where appropriate
- validate required fields with user-facing messages
- validate cross-field rules with `refine` or `superRefine`
- export inferred types from the schema

Example:

```ts
import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().min(7, 'Enter a phone number'),
  address: z.string().trim().min(5, 'Enter a delivery address'),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
```

## Formik Rules

- Use `initialValues` typed from the form value type.
- Use `validate={(values) => validateWithZod(schema, values)}`.
- Use `isSubmitting` to disable duplicate submission.
- Use `setFieldError` for field-level API validation errors.
- Use `setStatus` for form-level API errors.
- Reset only when the product behavior needs it.

## Accessibility Rules

Every field needs:

- `id`
- `name`
- visible `label`
- `autoComplete` where available
- `aria-invalid` when invalid
- `aria-describedby` connected to helper or error text

Error text should stay close to the input.

## Submission Rules

- Components should not call raw Axios directly.
- Submit through a service function or a mutation hook.
- Convert unknown errors to `ApiError`.
- Show a user-safe error message.
- Keep the form values after failed submission unless clearing them is safer.

## When To Split Components

Split a form into subcomponents when:

- a section has many fields
- a section repeats in multiple flows
- a field has complex behavior
- the parent component becomes hard to scan

Do not split just to create more files. Prefer one readable form file over a folder with proxy files and tiny wrappers.

## Current Project Notes

`src/features/auth/forms/auth-form.tsx`, `src/features/cart/forms/cart-promo-code-form.tsx`, and `src/components/layout/forms/footer-newsletter-form.client.tsx` follow the Formik + Zod direction with colocated config and schemas. Future form work should keep that structure and improve submission handling with real service/mutation boundaries when backend endpoints are connected.
