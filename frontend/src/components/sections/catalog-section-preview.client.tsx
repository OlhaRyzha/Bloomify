'use client';

import CatalogGrid from '@/features/catalog/list/catalog-grid';
import { MotionDiv } from '../ui/motion-div';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function CatalogSectionPreview() {
  return (
    <MotionDiv
      variants={containerVariants}
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
      <MotionDiv
        variants={itemVariants}
        className='col-span-3'>
        <CatalogGrid
          maxItems={3}
          pageSize={3}
          hideControls
        />
      </MotionDiv>
    </MotionDiv>
  );
}
