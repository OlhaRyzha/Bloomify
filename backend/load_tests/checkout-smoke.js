/**
 * k6 smoke test — POST /orders/checkout
 *
 * Run:  k6 run backend/load_tests/checkout-smoke.js
 * Env:  BASE_URL  (default: http://localhost:8000)
 *       PRODUCT_ID (default: 1 — must exist in the DB)
 *
 * Smoke = 1 VU, 20 iterations. Goal: endpoint is up and p(95) < 500 ms.
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const PRODUCT_ID = parseInt(__ENV.PRODUCT_ID || '1', 10);

export const options = {
  vus: 1,
  iterations: 20,
  thresholds: {
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  const payload = JSON.stringify({
    customerName: 'Load Test User',
    email: 'loadtest@example.com',
    phone: '+380671234567',
    city: 'Kyiv',
    address: 'Test St 1',
    paymentMethod: 'cash_on_delivery',
    items: [{ id: PRODUCT_ID, quantity: 1 }],
  });

  const res = http.post(`${BASE_URL}/orders/checkout`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'no server error': (r) => r.status !== 500,
    'responds in time': (r) => r.timings.duration < 500,
  });
}
