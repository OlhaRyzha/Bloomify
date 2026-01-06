import type { StaticImageData } from 'next/image';

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: StaticImageData | string;
  tag: string;
};
