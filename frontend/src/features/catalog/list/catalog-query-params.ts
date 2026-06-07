import { O, pipe } from '@mobily/ts-belt';
import { isValueGreaterThanZero } from '@/utils/guards/is-number';
import { DEFAULT_CATALOG_PARAMS } from './catalog.config';
import type { CatalogQueryParams, SortOption } from './catalog.types';

const PARAMS = {
  page: 'page',
  perPage: 'perPage',
  search: 'search',
  sort: 'sort',
  tag: 'tag',
} as const;

const VALID_SORTS: SortOption[] = [
  'default',
  'price-asc',
  'price-desc',
  'name-asc',
];

type ParamConfig = {
  key: keyof CatalogQueryParams;
  param: string;
  map?: (value: string) => string | number;
  validate?: (value: string | number) => boolean;
  def: string | number;
};

const trimValue = (value: string) => value.trim();

export function getCatalogQueryParams(
  search: string,
  defaults?: Partial<CatalogQueryParams>
): CatalogQueryParams {
  const baseDefaults: CatalogQueryParams = { ...DEFAULT_CATALOG_PARAMS, ...defaults };
  const params = new URLSearchParams(search);

  const PARAMS_CONFIG: ParamConfig[] = [
    {
      key: 'page',
      param: PARAMS.page,
      map: Number,
      validate: isValueGreaterThanZero,
      def: baseDefaults.page,
    },
    {
      key: 'perPage',
      param: PARAMS.perPage,
      map: Number,
      validate: isValueGreaterThanZero,
      def: baseDefaults.perPage,
    },
    {
      key: 'search',
      param: PARAMS.search,
      map: trimValue,
      def: baseDefaults.search,
    },
    {
      key: 'sort',
      param: PARAMS.sort,
      validate: (value) => VALID_SORTS.includes(value as SortOption),
      def: baseDefaults.sort,
    },
    {
      key: 'tag',
      param: PARAMS.tag,
      map: trimValue,
      def: baseDefaults.tag,
    },
  ];

  return PARAMS_CONFIG.reduce<CatalogQueryParams>(
    (acc, { key, param, map, validate, def }) => {
      const value = pipe(
        O.fromNullable(params.get(param)),
        map ? O.map(map) : O.map((x) => x),
        validate
          ? O.flatMap((val) => (validate(val) ? O.Some(val) : O.None))
          : O.map((val) => (val === '' ? def : val)),
        O.getWithDefault(def)
      );

      return { ...acc, [key]: value } as CatalogQueryParams;
    },
    {} as CatalogQueryParams
  );
}

export function setCatalogQueryParams(params: CatalogQueryParams) {
  const urlParams = new URLSearchParams();
  urlParams.set(PARAMS.page, String(params.page));
  urlParams.set(PARAMS.perPage, String(params.perPage));

  if (params.search.trim()) {
    urlParams.set(PARAMS.search, params.search.trim());
  }

  if (params.sort !== 'default') {
    urlParams.set(PARAMS.sort, params.sort);
  }

  if (params.tag && params.tag !== 'all') {
    urlParams.set(PARAMS.tag, params.tag);
  }

  const query = urlParams.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  window.history.replaceState(null, '', nextUrl);
}
