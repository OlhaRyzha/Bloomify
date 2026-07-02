/**
 * k6 load test — GET /products (catalog listing)
 *
 * Run: k6 run backend/load_tests/catalog-load.js
 * Env: BASE_URL (default: http://localhost:8000)
 *
 * Simulates concurrent catalog browsing: pagination, sorting, filtering.
 * Moderate load: 20 virtual users for 1 minute.
 * Goals:
 *   - p(95) < 300 ms (most requests fast)
 *   - p(99) < 500 ms (tail acceptable)
 *   - < 0.1% errors
 */
import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
  stages: [
    { duration: '10s', target: 5 },  // Ramp up to 5 users
    { duration: '30s', target: 20 }, // Continue to 20 users
    { duration: '20s', target: 5 },  // Ramp down
  ],
  thresholds: {
    'http_req_duration{staticAsset:no}': ['p(95)<300', 'p(99)<500'],
    'http_req_duration{staticAsset:yes}': ['p(99)<100'],
    checks: ['rate>=0.99'],
  },
};

export default function () {
  group('catalog browsing', () => {
    // List products with pagination
    let res = http.get(`${BASE_URL}/products?limit=20&offset=0`);
    check(res, {
      'catalog list status 200': (r) => r.status === 200,
      'response time < 300ms': (r) => r.timings.duration < 300,
    });

    // Sorted by price
    res = http.get(`${BASE_URL}/products?limit=20&offset=0&ordering=-price`);
    check(res, {
      'sorted list status 200': (r) => r.status === 200,
    });

    // Filtered by tags
    res = http.get(`${BASE_URL}/products?tags=wedding&limit=20`);
    check(res, {
      'filtered list status 200': (r) => r.status === 200,
    });

    // Different page
    res = http.get(`${BASE_URL}/products?limit=20&offset=40`);
    check(res, {
      'paginated list status 200': (r) => r.status === 200,
    });
  });

  group('site settings', () => {
    // Lightweight language/currency fetch
    const res = http.get(`${BASE_URL}/site/languages`);
    check(res, {
      'site languages status 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });
  });
}
