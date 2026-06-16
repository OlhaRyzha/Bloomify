/**
 * k6 smoke test — POST /payments/liqpay/callback
 *
 * Run:  k6 run backend/load_tests/liqpay-callback-smoke.js
 * Env:  BASE_URL (default: http://localhost:8000)
 *
 * Sends a request with invalid signature — LiqPay view must reject it with 400
 * before touching the DB. Validates that HMAC check is fast under load.
 * Smoke = 1 VU, 20 iterations. Goal: p(95) < 200 ms.
 */
import http from 'k6/http';
import { check } from 'k6';
import encoding from 'k6/encoding';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
  vus: 1,
  iterations: 20,
  thresholds: {
    http_req_duration: ['p(95)<200'],
    checks: ['rate==1.0'],
  },
};

export default function () {
  const data = encoding.b64encode(
    JSON.stringify({ order_id: 'smoke-test', status: 'success' })
  );

  const res = http.post(
    `${BASE_URL}/payments/liqpay/callback`,
    { data, signature: 'invalid-signature' },
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  check(res, {
    'rejects invalid signature with 400': (r) => r.status === 400,
    'responds in time': (r) => r.timings.duration < 200,
  });
}
