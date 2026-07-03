import Image from 'next/image';
import { createElement } from 'react';

import { cn } from '@/lib/utils';
import type { CategoryContentBlock } from '@/features/categories/api/categories.schemas';

const HEADING_CLASS_BY_LEVEL: Record<number, string> = {
  1: 'text-4xl md:text-5xl',
  2: 'text-2xl md:text-3xl',
  3: 'text-xl md:text-2xl',
  4: 'text-lg md:text-xl',
  5: 'text-base md:text-lg',
  6: 'text-sm md:text-base uppercase tracking-wide',
};

const TEXT_ALIGN_CLASS: Record<CategoryContentBlock['align'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const IMAGE_ALIGN_CLASS: Record<CategoryContentBlock['align'], string> = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
};

const IMAGE_SIZE_CLASS: Record<CategoryContentBlock['imageSize'], string> = {
  small: 'max-w-xs',
  medium: 'max-w-lg',
  full: 'w-full',
};

const IMAGE_RADIUS_CLASS: Record<CategoryContentBlock['imageRadius'], string> =
  {
    none: 'rounded-none',
    soft: 'rounded-2xl',
    large: 'rounded-[3rem]',
  };

function BlockHeading({ block }: { block: CategoryContentBlock }) {
  if (!block.title) return null;

  return createElement(
    `h${block.headingLevel}`,
    {
      className: cn(
        'font-display font-bold',
        HEADING_CLASS_BY_LEVEL[block.headingLevel],
        TEXT_ALIGN_CLASS[block.align]
      ),
    },
    block.title
  );
}

function BlockImage({ block }: { block: CategoryContentBlock }) {
  if (!block.imageUrl) return null;

  return (
    <figure
      className={cn(
        'relative aspect-3/2 overflow-hidden bg-gradient-card shadow-card',
        IMAGE_SIZE_CLASS[block.imageSize],
        IMAGE_ALIGN_CLASS[block.align],
        IMAGE_RADIUS_CLASS[block.imageRadius]
      )}>
      <Image
        src={block.imageUrl}
        alt={block.title}
        fill
        sizes='(max-width: 768px) 100vw, 768px'
        className='object-cover'
      />
    </figure>
  );
}

/**
 * Renders the ordered blocks of an admin-built info page.
 * Heading size, alignment, image size, and corner radius come from the
 * admin block settings; an image can accompany any block type.
 */
export default function CategoryContentBlocks({
  blocks,
}: {
  blocks: CategoryContentBlock[];
}) {
  return (
    <div className='max-w-3xl space-y-6'>
      {blocks.map((block) => (
        <div
          key={block.id}
          className='space-y-6'>
          {block.blockType === 'heading' && <BlockHeading block={block} />}
          {block.blockType === 'text' && block.body && (
            <p
              className={cn(
                'whitespace-pre-line leading-relaxed text-muted-foreground',
                TEXT_ALIGN_CLASS[block.align]
              )}>
              {block.body}
            </p>
          )}
          <BlockImage block={block} />
        </div>
      ))}
    </div>
  );
}
