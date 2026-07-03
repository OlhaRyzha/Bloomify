import Image from 'next/image';

import type { CategoryContentBlock } from '@/features/categories/api/categories.schemas';

type CategoryContentBlocksProps = {
  blocks: CategoryContentBlock[];
};

/**
 * Renders the ordered blocks of an admin-built info page:
 * headings, paragraphs, and optional images.
 */
export default function CategoryContentBlocks({
  blocks,
}: CategoryContentBlocksProps) {
  return (
    <div className='max-w-3xl space-y-6'>
      {blocks.map((block) => {
        if (block.blockType === 'heading') {
          return (
            <h2
              key={block.id}
              className='font-display text-2xl font-bold md:text-3xl'>
              {block.title}
            </h2>
          );
        }

        if (block.blockType === 'image' && block.imageUrl) {
          return (
            <figure
              key={block.id}
              className='relative aspect-[3/2] overflow-hidden rounded-2xl bg-gradient-card shadow-card'>
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

        if (block.blockType === 'text') {
          return (
            <p
              key={block.id}
              className='whitespace-pre-line leading-relaxed text-muted-foreground'>
              {block.body}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
