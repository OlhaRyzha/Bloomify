# Load Testing Guide

Load tests verify that critical endpoints remain performant and stable under concurrent load. Tests use [k6](https://k6.io) and should be run **before each production deploy**.

## Installation

```bash
# macOS
brew install k6

# Linux / other
See https://k6.io/docs/get-started/installation/

# Verify
k6 --version
```

## Test Types

### 1. Smoke Tests (CI, every commit)

Quick baseline checks run in CI to catch regressions early.

**`liqpay-callback-smoke.js`** — 20 invalid webhook signatures.
- Goal: All rejected in < 200 ms
- CI: `make load-test-callback`
- Verifies: Signature validation doesn't crash under load

**`checkout-smoke.js`** — 5 sequential successful checkouts.
- Goal: p(95) < 500 ms per request
- CI: `make load-test-checkout`
- Verifies: Happy path doesn't regress

### 2. Pre-Deployment Load Tests (Manual, before production)

Run against a clean staging environment (not main).

**`catalog-load.js`** — Browse catalog concurrently.

```bash
k6 run backend/load_tests/catalog-load.js \
  --env BASE_URL=https://staging.example.com \
  --env LOG_LEVEL=debug
```

**Scenario:**
- 20 concurrent users for 60 seconds
- Each user: list products (page 0-10), filter by category, search
- Tests: pagination, sorting, filtering under steady load

**Goals:**
| Metric | Goal | Action if Failed |
|--------|------|------------------|
| p(95) latency | < 300 ms | Investigate DB indexes |
| p(99) latency | < 500 ms | Check for slow queries |
| Error rate | < 0.1% | Verify API availability |
| Throughput | > 100 req/sec | Validate infrastructure scaling |

**`checkout-stress.js`** — Ramp load on checkout endpoint.

```bash
k6 run backend/load_tests/checkout-stress.js \
  --env BASE_URL=https://staging.example.com \
  --env PRODUCT_ID=1
```

**Scenario:**
- Ramp: 0 → 10 → 50 concurrent users (5 min total)
- Each user: attempt checkout once
- Tests: endpoint stability under peak load, graceful rate limiting

**Goals:**
| Metric | Goal | Action if Failed |
|--------|------|------------------|
| p(95) latency (peak) | < 1000 ms | Endpoint degrading; check workers |
| p(99) latency (peak) | < 2000 ms | Tail latency high; review DB |
| No 500 errors | 100% success or 429 | 5xx = outage; scale or fix |
| 429 (rate limit) graceful | ~10-20% at peak | Verify throttle config |

## Viewing Results

After a test completes, k6 prints a summary:

```
http_req_duration.........: avg=245ms    min=180ms    med=230ms    max=890ms    p(95)=510ms p(99)=780ms
http_reqs..................: 2000  66.7/s
http_errors...............: 0     0/s
```

### Export Results

Save results as JSON for comparison:

```bash
k6 run catalog-load.js --out json=results.json
```

Parse with `k6 merge` or custom script to track trends.

## Baselines & Thresholds

Each test file includes `thresholds` that fail if goals are not met:

```javascript
// Example from checkout-stress.js
export const options = {
  thresholds: {
    'http_req_duration{staticAsset:no}': ['p(95) < 1000'],
    'http_req_failed': ['rate < 0.1'],
  },
};
```

If a threshold fails, k6 exits with code `1`. CI will catch this.

**Current Baselines (Staging):**

| Test | Metric | Baseline | Monitor |
|------|--------|----------|---------|
| catalog-load | p(95) | < 300 ms | DB query time, Postgres cache hit rate |
| checkout-stress | p(95) peak | < 1000 ms | Worker CPU, rate limiter queue depth |
| liqpay-callback | p(95) | < 200 ms | Signature validation, Redis (if caching) |

## Common Scenarios

### Local Development

Run against local Django:

```bash
cd backend && python manage.py runserver

# In another terminal
k6 run load_tests/catalog-load.js --env BASE_URL=http://localhost:8000
```

### Pre-Deployment Checklist

Before pushing to production:

```bash
# 1. Smoke tests (fast)
make load-test-callback
make load-test-checkout

# 2. Full staging tests (10 min)
k6 run backend/load_tests/catalog-load.js --env BASE_URL=$STAGING_URL
k6 run backend/load_tests/checkout-stress.js --env BASE_URL=$STAGING_URL --env PRODUCT_ID=1

# 3. Collect results
k6 run backend/load_tests/catalog-load.js --out json=catalog-baseline.json
# Compare against previous baseline
```

### Production Monitoring

If issues arise in production, run a quick smoke test to confirm:

```bash
k6 run backend/load_tests/checkout-smoke.js --env BASE_URL=https://prod.example.com --duration 2m
```

**Do not run stress tests against production.** Use staging/QA instead.

## Troubleshooting

### "Connection refused" error

Verify backend is running:
```bash
curl $BASE_URL/api/products/  # Should return 200
```

### "p(95) latency > 1000ms"

1. Check backend logs: `docker logs backend`
2. Profile slow queries: `make db-profile`
3. Verify CPU/memory not maxed: `docker stats`
4. Run again with `--log-output=stdout` to see errors:
   ```bash
   k6 run --log-output=stdout catalog-load.js
   ```

### "Error rate > 5%"

Check if endpoint has errors:
```bash
k6 run --duration 30s checkout-smoke.js  # See response status codes
```

If 429 (rate limit), that's OK — verify other endpoints are 200/201.
If 500, that's a bug — fix and re-test.

## CI Integration

Smoke tests run on every commit via `.github/workflows/backend-ci.yml`:

```yaml
- name: Load test callback
  run: make load-test-callback

- name: Load test checkout
  run: make load-test-checkout
```

If a test fails, CI fails and blocks the PR.

## Extending Tests

### Add a New Scenario

1. Create `backend/load_tests/my-scenario.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '30s', target: 20 },  // Hold
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95) < 500'],
  },
};

export default function () {
  const response = http.get(`${__ENV.BASE_URL}/api/endpoint`);
  check(response, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

2. Test locally:
```bash
k6 run backend/load_tests/my-scenario.js --env BASE_URL=http://localhost:8000
```

3. Add to Makefile (optional):
```makefile
load-test-scenario:
	k6 run backend/load_tests/my-scenario.js --env BASE_URL=http://localhost:8000
```

### Adjust VU (Virtual Users) and Duration

Modify `options.stages`:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // More users
    { duration: '2m', target: 50 },   // Longer hold
  ],
};
```

## Related Commands

```bash
# Run all smoke tests (from root)
make load-test-callback
make load-test-checkout

# Run specific test with custom env
k6 run backend/load_tests/catalog-load.js \
  --env BASE_URL=http://localhost:8000 \
  --duration 30s

# Output results as JSON
k6 run backend/load_tests/checkout-stress.js --out json=report.json

# Quiet mode (less output)
k6 run --quiet catalog-load.js
```

## Performance Budget Reference

Frontend performance budgets live in `frontend/performance-budget.json`.
Backend load test baselines should be monitored similarly; consider adding metrics to your monitoring dashboard (Grafana, DataDog, etc.).
