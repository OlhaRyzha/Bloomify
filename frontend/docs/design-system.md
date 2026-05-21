# Bloomify Design System Reference

> Romantic floral commerce, calm checkout, soft premium gifting.

**Theme:** light-first, dark mode supported through existing CSS variables.

Bloomify uses a warm botanical visual system: cream surfaces, blush accents,
sage/forest greens, restrained gold highlights, rounded forms, and soft depth.
The interface should feel elegant and trustworthy, not decorative for its own
sake. Product imagery carries the emotional weight; UI components should stay
quiet, readable, and consistent.

Use this document when creating or modifying frontend UI. It complements
`semantic-accessibility.md`: semantic markup and accessibility remain part of
the design standard.

## Source Of Truth

- Theme tokens live in `frontend/src/app/globals.css`.
- Tailwind token mapping lives in `frontend/tailwind.config.ts`.
- shadcn/ui config lives in `frontend/components.json`.
- Reusable primitives live in `frontend/src/components/ui`.
- Shared layout components live in `frontend/src/components/layout`.
- Feature UI lives under the owning `frontend/src/features/*` folder.

Do not invent a separate design language in feature code. Prefer existing
tokens, shadcn primitives, and local UI components first.

## Visual Direction

- **Mood:** premium, soft, floral, composed, gift-ready.
- **Density:** comfortable. Avoid cramped forms and dense dashboards.
- **Surfaces:** cream and near-white cards with very soft green/pink depth.
- **Accent:** forest green for primary actions and meaningful active states.
- **Warmth:** blush and peach as secondary/accent fills, not dominant page color.
- **Depth:** soft shadows only; avoid harsh elevation and dark outlines.
- **Imagery:** real bouquet/product imagery should be visible and inspectable.

## Tokens - Colors

Use semantic Tailwind classes whenever possible: `bg-background`,
`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`,
`bg-primary`, `text-primary`, `bg-secondary`, `bg-muted`.

| Name                  | CSS Variable                       | Tailwind                                 | Role                                       |
| --------------------- | ---------------------------------- | ---------------------------------------- | ------------------------------------------ |
| Background Cream      | `--background: 30 25% 98%`         | `bg-background`                          | Page background and full-width sections    |
| Foreground Forest Ink | `--foreground: 150 15% 15%`        | `text-foreground`                        | Primary text and headings                  |
| Card Cream            | `--card: 30 30% 97%`               | `bg-card`                                | shadcn card backgrounds                    |
| Primary Forest        | `--primary: 150 35% 25%`           | `bg-primary`, `text-primary`             | Main CTA, active controls, key icons       |
| Primary Foreground    | `--primary-foreground: 30 25% 98%` | `text-primary-foreground`                | Text on primary fills                      |
| Secondary Blush       | `--secondary: 350 45% 90%`         | `bg-secondary`                           | Soft badges and gentle emphasis            |
| Muted Sage            | `--muted: 140 20% 92%`             | `bg-muted`                               | Subtle panels, inactive fills, info blocks |
| Muted Text            | `--muted-foreground: 150 10% 45%`  | `text-muted-foreground`                  | Supporting copy and metadata               |
| Accent Blush          | `--accent: 350 50% 85%`            | `bg-accent`                              | Hover states and secondary interaction     |
| Border Sage           | `--border: 140 15% 88%`            | `border-border`                          | Borders, separators, input outlines        |
| Destructive Red       | `--destructive: 0 65% 55%`         | `text-destructive`, `border-destructive` | Errors and destructive actions             |
| Gold                  | `--gold: 40 70% 55%`               | `text-gold`, `bg-gold`                   | Rare highlight only                        |
| Blush                 | `--blush: 350 55% 88%`             | `bg-blush`                               | Favorite state, floral accent              |
| Sage                  | `--sage: 145 25% 75%`              | `bg-sage`                                | Botanical supporting accent                |
| Forest                | `--forest: 150 40% 20%`            | `bg-forest`, `text-forest`               | Deep botanical accent                      |

### Gradients

| Token             | Class              | Role                                         |
| ----------------- | ------------------ | -------------------------------------------- |
| `--gradient-hero` | `bg-gradient-hero` | Hero and emotional landing sections          |
| `--gradient-card` | `bg-gradient-card` | Product cards, checkout panels, empty states |
| `--gradient-cta`  | `bg-gradient-cta`  | Strong CTA moments only                      |

Use gradients sparingly. Avoid stacking gradient panels inside gradient cards.

## Typography

Fonts are provided through CSS variables:

- `--font-display`: headings, brand title, product names, section headers.
- `--font-body`: body copy, forms, controls, navigation.

Rules:

- Use `.font-display` for page headings, product names, and card titles.
- Use body font for inputs, buttons, labels, descriptions, and table-like data.
- Do not introduce new font families in feature code.
- Do not use negative letter spacing by default.
- Keep uppercase tracking for small labels only, for example product tags and
  metadata labels.

Recommended type roles:

| Role            | Class Pattern                                              |
| --------------- | ---------------------------------------------------------- |
| Page heading    | `font-display text-4xl font-bold md:text-5xl`              |
| Section heading | `font-display text-3xl font-bold`                          |
| Card title      | `font-display text-xl/2xl font-semibold`                   |
| Body text       | `text-sm` or `text-base text-muted-foreground`             |
| Labels          | `text-sm font-medium text-foreground`                      |
| Metadata        | `text-xs uppercase tracking-[0.2em] text-muted-foreground` |

## Spacing And Layout

Base rhythm follows Tailwind's spacing scale with comfortable gaps.

| Use                           | Preferred Classes                     |
| ----------------------------- | ------------------------------------- |
| Page top offset under header  | `pt-28`                               |
| Page bottom spacing           | `pb-16`                               |
| Page width                    | `mx-auto max-w-8/10 px-4`             |
| Major grid gap                | `gap-8`, `gap-10`                     |
| Section/card internal padding | `p-5`, `p-6`, `p-10` for empty states |
| Form field stack              | label `mb-2 block`, error `mt-2`      |
| Repeated item gap             | `space-y-4`, `space-y-6`              |
| Inline control gap            | `gap-2`, `gap-3`, `gap-4`             |

Rules:

- Keep forms comfortably spaced. Labels need visible separation from inputs.
- Use responsive grids such as `grid gap-4 md:grid-cols-2`.
- Avoid nested cards. A page section may contain cards, but cards should not
  contain other decorative cards unless the inner element is a true sub-panel.
- For operational views such as checkout/cart, prioritize scannability over
  marketing-style composition.

## Radius And Shadows

Global radius starts at `--radius: 0.75rem`.

| Element              | Preferred Classes                                               |
| -------------------- | --------------------------------------------------------------- |
| Buttons              | shadcn `Button`, default `rounded-md`; do not override casually |
| Inputs               | `Input` component, `rounded-md`                                 |
| Product cards        | `rounded-xl` / `rounded-2xl` / `rounded-3xl` where established  |
| Product images       | `rounded-2xl` / `rounded-3xl` on large detail views             |
| Empty states         | `rounded-2xl bg-gradient-card p-10 shadow-card`                 |
| Checkout/cart panels | `rounded-3xl bg-gradient-card p-6 shadow-card`                  |

Shadow tokens:

- `shadow-soft`: subtle containers and headers.
- `shadow-card`: cards, checkout panels, product cards.
- `shadow-elevated`: hover emphasis for product cards only.

Avoid custom box shadows in feature code unless a new shared token is added.

## shadcn/ui Usage

Bloomify uses shadcn/ui with:

- style: `new-york`
- icons: `lucide-react`
- aliases: `@/components/ui`, `@/lib/utils`, `@/hooks`
- CSS variables enabled

Reuse these primitives before creating new ones:

| Need              | Use                                                             |
| ----------------- | --------------------------------------------------------------- |
| Action            | `Button` from `@/components/ui/button`                          |
| Form field        | `Input` from `@/components/ui/input`                            |
| Select/dropdown   | `Select` primitives from `@/components/ui/select`               |
| Badge/status      | `Badge` from `@/components/ui/badge`                            |
| Card shell        | `Card`, `CardHeader`, `CardContent` from `@/components/ui/card` |
| Separator         | `Separator` from `@/components/ui/separator`                    |
| Toast feedback    | `useToast`, `Toaster`, `Toast`                                  |
| Loading           | `Loader`, `Skeleton`, `QueryLoader`, feature skeletons          |
| Small info panel  | `InfoCard` from `@/components/ui/info-card`                     |
| Animation wrapper | `MotionDiv` from `@/components/ui/motion-div`                   |

### Buttons

Use shadcn `Button` variants instead of one-off button classes.

- Primary CTA: `<Button>` default variant.
- Secondary action: `<Button variant="outline">`.
- Low-emphasis action: `<Button variant="ghost">`.
- Navigation action: use `Button asChild` with `Link`.
- Icon-only action: use `size="icon"`, `icon-sm`, or `icon-lg` with
  `aria-label`.

Do not implement clickable `div` or custom button-like wrappers.

### Forms

Checkout/auth/cart forms follow Formik + Zod.

Rules:

- Labels are visible and connected with `htmlFor`.
- Label to input spacing should be explicit: label `mb-2 block`.
- Error text belongs close to the field: `mt-2 text-xs font-medium
text-destructive`.
- Use `aria-invalid` and `aria-describedby`.
- Keep localized validation messages in locale JSON when form copy is
  user-facing in multiple languages.

### Cards And Panels

Use shadcn `Card` for generic reusable card shells. For established feature
surfaces, existing pattern is acceptable:

```tsx
<section className='rounded-3xl bg-gradient-card p-6 shadow-card'>...</section>
```

Use semantic elements first: `section`, `article`, `aside`, `form`,
`fieldset`, `legend`.

## Component Patterns

### Product Card

Use `CatalogCard` instead of building product cards from scratch.

Pattern:

- `Card` with `bg-gradient-card shadow-card`.
- Product image in an aspect-square media region.
- Favorite icon button in top-right.
- Product tag as small pill.
- Product name as a link.
- Price and `AddToCartButton` in the footer.

### Checkout Panel

Pattern:

```tsx
<section className='space-y-5 rounded-3xl bg-gradient-card p-6 shadow-card'>
  <div className='flex items-center gap-3'>
    <Icon
      className='h-5 w-5 text-primary'
      aria-hidden
    />
    <h2 className='font-display text-2xl font-semibold'>...</h2>
  </div>
  ...
</section>
```

Use `fieldset` for payment method radio groups. Wallet labels should be
customer-facing payment methods (`Apple Pay`, `Google Pay`, `Card`, `Payment
on delivery`). Provider names such as LiqPay belong in helper/security notes,
not as the main method unless the customer explicitly chooses a provider
checkout page.

### Empty State

Pattern:

```tsx
<section className='rounded-2xl bg-gradient-card p-10 text-center shadow-card'>
  <h2 className='font-display mb-3 text-2xl font-bold'>...</h2>
  <p className='mb-6 text-sm text-muted-foreground'>...</p>
  <Button
    asChild
    size='lg'>
    <Link href='...'>...</Link>
  </Button>
</section>
```

### Info Card

Use `InfoCard` for two-column supporting facts such as delivery,
composition, packaging, and support.

## Icons

Use `lucide-react`. Choose familiar symbols:

- Cart/order: `ShoppingBag`, `CreditCard`, `WalletCards`.
- Delivery/address: `MapPin`.
- Trust/security: `ShieldCheck`, `BadgeCheck`.
- Controls: `Search`, `SlidersHorizontal`, `ArrowUpDown`.
- Quantity: `Plus`, `Minus`, `Trash2`.

Icons inside buttons need accessible labels on the button when the button has
no visible text.

## Localization And Copy

- User-facing text belongs in `frontend/src/locales/*/translation.json`.
- Keep keys snake_case.
- Keep validation messages localized when the form is localized.
- Avoid technical provider language in primary UI labels. Use provider names
  in notes when they build trust, for example “Payments are processed securely
  by LiqPay.”

## Do's

- Reuse `Button`, `Input`, `Select`, `Badge`, `Card`, `InfoCard`,
  `AddToCartButton`, and feature components.
- Use semantic tokens instead of raw colors.
- Keep page sections constrained with the shared `Container` component; its large width is `max-w-8/10 px-4`.
- Use `bg-gradient-card` and `shadow-card` for premium feature surfaces.
- Keep field spacing explicit and accessible.
- Preserve localization and accessible names in new UI.
- Use real product imagery where the user needs to inspect products.

## Don'ts

- Do not add a new design system or raw color palette inside feature files.
- Do not create barrel `index.ts` files just to shorten imports.
- Do not use cards inside cards as decoration.
- Do not add decorative gradient orbs, bokeh blobs, or one-off SVG hero art.
- Do not use `div` as an interactive control.
- Do not store card details or payment secrets in frontend state beyond a
  provider-tokenized flow.
- Do not show LiqPay as a main payment method when the user is choosing Apple
  Pay, Google Pay, card, or payment on delivery; LiqPay is the processor.

## Agent Prompt Guide

Quick token reference:

- Page background: `bg-background`
- Main text: `text-foreground`
- Supporting text: `text-muted-foreground`
- Main action: `Button` default / `bg-primary text-primary-foreground`
- Secondary action: `Button variant="outline"`
- Soft panel: `rounded-3xl bg-gradient-card p-6 shadow-card`
- Empty state: `rounded-2xl bg-gradient-card p-10 text-center shadow-card`
- Border: `border-border`
- Error: `text-destructive`, `border-destructive`

Example prompts for agents:

- “Create a checkout section using existing shadcn `Button` and `Input`,
  `rounded-3xl bg-gradient-card p-6 shadow-card`, explicit label spacing
  (`mb-2 block`), localized validation text, and semantic `section`/`fieldset`
  markup.”
- “Create a product-related card by reusing `CatalogCard` or matching its
  existing `bg-gradient-card shadow-card` treatment. Do not introduce a new
  product card primitive unless multiple features need it.”
- “Create a secondary information panel with `InfoCard` and `text-primary`
  uppercase metadata label. Keep body copy `text-sm text-muted-foreground`.”
- “Add a CTA with shadcn `Button asChild` wrapping `Link`; do not style a link
  as a button manually.”

## Quick CSS Reference

Current theme excerpt from `globals.css`:

```css
:root {
  --background: 30 25% 98%;
  --foreground: 150 15% 15%;
  --card: 30 30% 97%;
  --primary: 150 35% 25%;
  --primary-foreground: 30 25% 98%;
  --secondary: 350 45% 90%;
  --muted: 140 20% 92%;
  --muted-foreground: 150 10% 45%;
  --accent: 350 50% 85%;
  --border: 140 15% 88%;
  --destructive: 0 65% 55%;
  --radius: 0.75rem;
  --blush: 350 55% 88%;
  --sage: 145 25% 75%;
  --forest: 150 40% 20%;
  --gold: 40 70% 55%;
  --peach: 25 70% 90%;
}
```
