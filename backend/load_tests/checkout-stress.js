/**
 * k6 stress test — POST /orders/checkout
 *
 * Run: k6 run backend/load_tests/checkout-stress.js
 * Env: BASE_URL  (default: http://localhost:8000)
 *      PRODUCT_ID (default: 1 — must exist in the DB)
 *
 * Stress test: simulate high concurrent checkout load.
 * Ramps from 5 to 50 virtual users over 2 minutes.
 * Goals:
 *   - Endpoint remains available (no 500 errors)
 *   - Rate limiting kicks in gracefully (429 acceptable when limit hit)
 *   - p(95) < 1000 ms under load
 */
import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const PRODUCT_ID = parseInt(__ENV.PRODUCT_ID || '1', 10);

const checkoutErrors = new Rate('checkout_errors');
const checkoutDuration = new Trend('checkout_duration');

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp up to 5 users
    { duration: '60s', target: 50 },  // Ramp up to 50 users
    { duration: '30s', target: 50 },  // Stay at peak
    { duration: '20s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'checkout_errors': ['rate<0.05'],  // Allow max 5% error rate (rate limiting is ok)
    'checkout_duration': ['p(95)<1000', 'p(99)<2000'],
    checks: ['rate>=0.95'],
  },
};

export default function () {
  group('checkout stress', () => {
    const payload = JSON.stringify({
      customerName: `Stress Test User ${__VU}`,
      email: `stress-${__VU}-${__ITER}@example.com`,
      phone: '+380671234567',
      city: 'Kyiv',
      address: 'Test St 1',
      paymentMethod: 'cash_on_delivery',
      items: [{ id: PRODUCT_ID, quantity: 1 }],
    });

    const res = http.post(`${BASE_URL}/orders/checkout`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    });

    const isError = res.status >= 400 && res.status < 429; // Don't count rate limiting as error
    const isRateLimited = res.status === 429;

    checkoutErrors.add(isError ? 1 : 0);
    checkoutDuration.add(res.timings.duration);

    check(res, {
      'status 201 (created)': (r) => r.status === 201,
      'not server error': (r) => r.status < 500,
      'responds within 2s': (r) => r.timings.duration < 2000,
      'rate limiting or success': (r) =>
        r.status === 201 || r.status === 429 || r.status === 400,
    });

    if (isRateLimited) {
      // Log rate limiting info
      console.log(`VU ${__VU} hit rate limit at iteration ${__ITER}`);
    }
  });
}
