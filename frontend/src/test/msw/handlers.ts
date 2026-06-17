import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';

import {
  createProductFiltersResponse,
  createProductListResponse,
} from '@/features/catalog/api/products.factory';
import { apiUrl } from '@/test/api-url';

export const handlers: RequestHandler[] = [
  http.get(apiUrl('products'), () =>
    HttpResponse.json(createProductListResponse())
  ),

  http.get(apiUrl('products/filters'), () =>
    HttpResponse.json(createProductFiltersResponse())
  ),
];
