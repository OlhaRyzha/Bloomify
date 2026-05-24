# Semantic HTML And Accessibility

Accessibility is part of correctness. A UI is not complete if it only looks right visually.

## Semantic HTML

Use semantic elements before generic wrappers:

- `main` for the primary page content.
- `section` for a meaningful page region with a heading or accessible label.
- `article` for standalone product/card/detail content.
- `header` for introductory content inside a page, section, card, or article.
- `nav` for navigation groups.
- `form` for user-submitted input groups.
- `fieldset` and `legend` for grouped form controls.
- `button` for actions.
- `a`/`Link` for navigation.
- `ul`/`ol` for lists of repeated items.

Use `div` only for layout when no semantic element fits.

## Headings

- Every page should have one clear `h1`.
- Section headings should follow hierarchy: `h2`, then `h3`, and so on.
- Do not choose heading levels for visual size; use CSS for size.
- If a visible heading is not desired but a region needs a name, use `aria-label` or a visually hidden heading.

## Buttons And Links

- Use `button` for in-place actions: add to cart, remove item, increment quantity, open menu.
- Use `Link`/`a` for navigation: product detail, catalog, auth pages.
- Icon-only buttons need `aria-label`.
- Toggle buttons need `aria-pressed`.
- Disabled buttons must communicate why they are disabled when the reason is not obvious.

## Forms

- Every input must have a real label.
- Use `htmlFor` and matching `id`.
- Use `autoComplete` where possible.
- Use `aria-invalid` when a field has an error.
- Use `aria-describedby` to connect fields to helper text and error text.
- Field errors should be visible near the field.
- Form-level errors should appear near the submit action or at the top of the form.
- Submission state should be visible and should prevent duplicate submissions.

## Loading, Empty, And Error States

Every async surface should define:

- loading state
- empty state
- error state
- success/content state

Loading:

- Use skeletons for layout-preserving loading where content shape is known.
- Use spinners only for short, isolated operations.
- Do not shift layout after data arrives if avoidable.

Empty:

- Explain what is empty.
- Provide a useful next action.
- Avoid treating empty data as an error.

Errors:

- Show user-safe messages.
- Keep technical details in logs or diagnostics.
- Preserve navigation so the user can recover.

Implementation standards:

- Use feature skeletons for page-level loading when the final layout is known.
- Use `FeedbackState` for shared empty/error panels.
- Use `role="status"` for neutral empty/status messages.
- Use `role="alert"` for error states that need immediate announcement.
- Keep actions keyboard reachable and give icon-only retry/close controls an
  accessible name.
- Do not animate a parent container that contains readable text from
  `opacity: 0`; it can create temporary contrast failures and poor reduced
  motion behavior.

## ARIA Rules

Prefer native semantics first. Add ARIA only when native HTML cannot express the behavior.

Good ARIA usage:

- `aria-label` for icon-only controls.
- `aria-labelledby` to name a section from a visible heading.
- `aria-describedby` for helper/error text.
- `aria-current="page"` for active pagination/navigation item.
- `aria-pressed` for toggle buttons.
- `role="status"` or `aria-live="polite"` for non-blocking async status.

Avoid:

- ARIA that repeats visible text without adding meaning.
- `role="button"` on non-button elements when a real `button` can be used.
- clickable `div` or `span`.
- hiding focus outlines without a replacement.

## Keyboard And Focus

- All interactive controls must be reachable by keyboard.
- Focus states must be visible.
- Opening overlays should move focus into the overlay.
- Closing overlays should return focus to the trigger.
- Escape should close dismissible overlays.
- Tab order should match visual and logical reading order.

## Images

- Product images need meaningful `alt` text.
- Decorative images should use empty alt text when they do not add content.
- Avoid putting important text only inside images.
- Use `figure` when the image is part of the content structure.

## Review Checklist

Before finishing UI work:

- Is the markup meaningful without CSS?
- Can the flow be completed with keyboard only?
- Are fields labeled and errors connected?
- Are loading, empty, and error states defined?
- Do icon-only controls have accessible names?
- Are links and buttons used for the correct purpose?
- Does `make frontend-test-e2e-a11y` pass for affected critical pages?
