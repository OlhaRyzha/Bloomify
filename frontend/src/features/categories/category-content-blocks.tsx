import Image from 'next/image';

import type { CategoryContentBlock } from '@/features/categories/api/categories.schemas';

type CategoryContentBlocksProps = {
  blocks: CategoryContentBlock[];
};

function BlockImage({ block }: { block: CategoryContentBlock }) {
  if (!block.imageUrl) return null;

  return (
    <figure className='relative aspect-[3/2] overflow-hidden rounded-2xl bg-gradient-card shadow-card'>
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
 * An uploaded image is shown for any block type, so admins can attach
 * a photo to a heading or a paragraph without a separate image block.
 */
export default function CategoryContentBlocks({
  blocks,
}: CategoryContentBlocksProps) {
  return (
    <div className='max-w-3xl space-y-6'>
      {blocks.map((block) => (
        <div
          key={block.id}
          className='space-y-6'>
          {block.blockType === 'heading' && block.title && (
            <h2 className='font-display text-2xl font-bold md:text-3xl'>
              {block.title}
            </h2>
          )}
          {block.blockType === 'text' && block.body && (
            <p className='whitespace-pre-line leading-relaxed text-muted-foreground'>
              {block.body}
            </p>
          )}
          <BlockImage block={block} />
        </div>
      ))}
    </div>
  );
}
