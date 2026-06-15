'use client';

import { ArrowUpDown, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useTranslation } from '@/hooks/use-translation';
import { SortOption } from '../types';
import { blurFocusedElementByIdOnOpen } from '@/utils/dom/blur-focused-element-by-id-on-open';
import { DEFAULT_TAG } from '../catalog.config';

const SALE_TAG_MARKER = '__sale__';

type CatalogControlsProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  availableTags: string[];
};

export function CatalogControls({
  searchInput,
  onSearchChange,
  sort,
  onSortChange,
  tagFilter,
  onTagFilterChange,
  availableTags,
}: CatalogControlsProps) {
  const { t } = useTranslation();

  const resolveTagLabel = (tag: string) =>
    tag === SALE_TAG_MARKER ? t('product_tag_sale') : tag;
  const searchInputId = 'catalog-search';
  const sortSelectId = 'catalog-sort';
  const tagSelectId = 'catalog-tag-filter';

  const sortLabelByValue: Record<SortOption, string> = {
    default: t('controls_sort_options_default'),
    'price-asc': t('controls_sort_options_price_asc'),
    'price-desc': t('controls_sort_options_price_desc'),
    'name-asc': t('controls_sort_options_name_asc'),
  };

  return (
    <section
      className='mb-2 flex min-w-0 flex-col gap-4 rounded-2xl bg-gradient-card px-4 py-4 shadow-card sm:px-5 lg:flex-row lg:items-center lg:justify-between'
      aria-label={t('controls_label')}>
      <div className='w-full min-w-0 lg:max-w-sm'>
        <label
          htmlFor={searchInputId}
          className='sr-only'>
          {t('controls_search_label')}
        </label>
        <Input
          id={searchInputId}
          name='catalogSearch'
          type='search'
          placeholder={t('controls_search_placeholder')}
          className='h-10 w-full min-w-0'
          prefix={
            <Search
              className='h-4 w-4 text-muted-foreground'
              aria-hidden
            />
          }
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className='grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto'>
        <div className='flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm'>
          <ArrowUpDown
            className='h-4 w-4 shrink-0 text-muted-foreground'
            aria-hidden
          />
          <span
            id={`${sortSelectId}-label`}
            className='shrink-0 text-muted-foreground'>
            {t('controls_sort_label')}
          </span>
          <Select
            value={sort}
            onOpenChange={blurFocusedElementByIdOnOpen(sortSelectId)}
            onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger
              id={sortSelectId}
              aria-labelledby={`${sortSelectId}-label`}
              className='h-9 min-w-0 flex-1 rounded-md border-0 bg-transparent px-2 py-0 text-sm font-semibold shadow-none focus-visible:ring-0'>
              <SelectValue>
                <span className='min-w-0 truncate'>
                  {sort === 'default' ? (
                    <span className='hidden sm:inline'>
                      {sortLabelByValue.default}
                    </span>
                  ) : (
                    sortLabelByValue[sort]
                  )}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent position='popper'>
              <SelectItem value='default'>
                {t('controls_sort_options_default')}
              </SelectItem>
              <SelectItem value='price-asc'>
                {t('controls_sort_options_price_asc')}
              </SelectItem>
              <SelectItem value='price-desc'>
                {t('controls_sort_options_price_desc')}
              </SelectItem>
              <SelectItem value='name-asc'>
                {t('controls_sort_options_name_asc')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {availableTags.length > 0 && (
          <div className='flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm'>
            <SlidersHorizontal
              className='h-4 w-4 shrink-0 text-muted-foreground'
              aria-hidden
            />
            <span
              id={`${tagSelectId}-label`}
              className='shrink-0 text-muted-foreground'>
              {t('controls_tag_label')}
            </span>
            <Select
              value={tagFilter}
              onOpenChange={blurFocusedElementByIdOnOpen(tagSelectId)}
              onValueChange={onTagFilterChange}>
              <SelectTrigger
                id={tagSelectId}
                aria-labelledby={`${tagSelectId}-label`}
                className='h-9 min-w-0 flex-1 rounded-md border-0 bg-transparent px-2 py-0 text-sm font-semibold shadow-none focus-visible:ring-0'>
                <SelectValue placeholder={t('controls_tag_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_TAG}>
                  {t('controls_tag_all')}
                </SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem
                    key={tag}
                    value={tag}>
                    {resolveTagLabel(tag)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </section>
  );
}
