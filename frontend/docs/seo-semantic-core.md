# SEO Semantic Core

Semantic core for Bloomify — an online flower shop in Kyiv. Ukrainian is the
primary market language; English and Polish mirror the same clusters with
lower priority.

Today the site ranks only for brand queries ("bloomify замовити букет").
The goal of this core is to capture non-brand commercial queries.

## How to use this document

- Every cluster maps to exactly one target page. Do not target the same
  cluster from two pages — they will compete with each other.
- Keywords go into: page `title` / `description`, `h1`/`h2`, visible SEO text
  blocks, and footer anchor texts.
- Keep texts truthful: only promise delivery times, prices, and services the
  shop actually provides.

## Cluster 1 — Transactional core (top priority)

Target pages: `/` (home), `/catalog`

| Query (uk) | Query (en) | Intent |
| --- | --- | --- |
| купити букет київ | buy bouquet kyiv | transactional |
| доставка квітів київ | flower delivery kyiv | transactional |
| замовити квіти з доставкою | order flowers with delivery | transactional |
| букети з доставкою київ | bouquets with delivery kyiv | transactional |
| квіти купити онлайн | buy flowers online | transactional |
| магазин квітів київ | flower shop kyiv | navigational/commercial |

## Cluster 2 — Occasions (high conversion)

Target page: `/catalog` (SEO text + footer links)

| Query (uk) | Query (en) |
| --- | --- |
| букет на день народження | birthday bouquet |
| букет для дівчини | bouquet for girlfriend |
| букет для мами | bouquet for mom |
| весільний букет київ | wedding bouquet kyiv |
| квіти на 8 березня | flowers for march 8 |
| квіти на річницю | anniversary flowers |
| букет на випускний | graduation bouquet |

## Cluster 3 — Flower types

Target page: `/catalog` (SEO text)

| Query (uk) | Query (en) |
| --- | --- |
| купити троянди київ | buy roses kyiv |
| букет півоній | peony bouquet |
| букет тюльпанів | tulip bouquet |
| авторський букет | signature bouquet |
| сезонні букети | seasonal bouquets |

## Cluster 4 — Flower subscription (low competition, unique offer)

Target page: `/subscriptions`

| Query (uk) | Query (en) |
| --- | --- |
| підписка на квіти | flower subscription |
| квіти щомісяця | monthly flowers |
| квіти щотижня в офіс | weekly office flowers |
| регулярна доставка квітів | recurring flower delivery |

## Cluster 5 — Services (B2B / events)

Target: home `#services` section + footer service links (already exist)

| Query (uk) | Query (en) |
| --- | --- |
| весільна флористика київ | wedding floristry kyiv |
| корпоративні квіти | corporate flowers |
| оформлення свят квітами | event flower decoration |
| подарункові кошики київ | gift baskets kyiv |

## Where keywords live in the code

| Surface | Location |
| --- | --- |
| Page titles/descriptions | `frontend/src/locales/*/translation.json` → `metadata_*` keys |
| SEO text blocks | `seo_home_*` and `seo_catalog_*` keys, rendered by `SeoTextBlock` |
| Footer popular links | `POPULAR_LINKS` in `frontend/src/constants/navigation.constants.tsx`, labels `footer_popular_*` |
| Structured data | `frontend/src/app/layout.tsx` (Organization/WebSite), catalog breadcrumbs |

## Rules for SEO texts

- Server-rendered, visible content (no hidden text — Google penalizes it).
- 500–1200 characters per block; one `h2`, short paragraphs.
- Natural keyword usage — write for the customer first.
- Every locale gets its own text (uk/en/pl), not machine-translated word-for-word.
- Update texts seasonally (March 8, Valentine's, September 1) — seasonal
  queries spike and fade.

## Measuring

- Google Search Console: track impressions/clicks per query cluster.
- Expect first non-brand impressions in 2–6 weeks after indexing.
- If a cluster gets impressions but no clicks — rework title/description of
  the target page, not the text block.
