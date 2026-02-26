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
import type { SortOption } from './catalog.types';

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
  return (
    <div className='mb-2 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-card px-5 py-4 shadow-card'>
      <Input
        type='search'
        placeholder='Пошук букету'
        className='h-10 w-52'
        prefix={<Search className='h-4 w-4 text-muted-foreground' />}
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm'>
          <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
          <span className='text-muted-foreground'>Сортування</span>
          <Select
            value={sort}
            onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger className='h-9 rounded-md border-0 bg-transparent px-2 py-0 text-sm font-semibold shadow-none focus-visible:ring-0'>
              <SelectValue placeholder='Сортування' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='default'>Без</SelectItem>
              <SelectItem value='price-asc'>Ціна ↑</SelectItem>
              <SelectItem value='price-desc'>Ціна ↓</SelectItem>
              <SelectItem value='name-asc'>Назва A→Я</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {availableTags.length > 0 && (
          <div className='flex items-center gap-2 rounded-lg border border-border bg-background px-3  text-sm font-medium text-foreground shadow-sm'>
            <SlidersHorizontal className='h-4 w-4 text-muted-foreground' />
            <span className='text-muted-foreground'>Тег</span>
            <Select
              value={tagFilter}
              onValueChange={onTagFilterChange}>
              <SelectTrigger className='h-9 rounded-md border-0 bg-transparent px-2 py-0 text-sm font-semibold shadow-none focus-visible:ring-0'>
                <SelectValue placeholder='Тег' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Всі</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem
                    key={tag}
                    value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
