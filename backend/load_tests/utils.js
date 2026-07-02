/**
 * Shared k6 test utilities
 *
 * Usage:
 *   import { createCheckName, extractMetric, logResult } from './utils.js';
 */

/**
 * Create standardized check name with context
 * @param {string} operation - e.g. "catalog list", "checkout"
 * @param {string} expectedValue - e.g. "status 200"
 * @returns {string} - e.g. "catalog list: status 200"
 */
export function createCheckName(operation, expectedValue) {
  return `${operation}: ${expectedValue}`;
}

/**
 * Convenience check runner for HTTP responses
 * @param {Response} response - k6 http response
 * @param {object} checks - { 'description': (r) => boolean }
 * @returns {object} - check results
 *
 * Usage:
 *   const res = http.get(...);
 *   httpCheck(res, {
 *     'status is 200': r => r.status === 200,
 *     'latency < 300ms': r => r.timings.duration < 300,
 *   });
 */
export function httpCheck(response, checks) {
  const { check } = require('k6');
  return check(response, checks);
}

/**
 * Log result with consistent format
 * @param {string} testName - e.g. "catalog-load"
 * @param {object} metric - { name, value, unit, threshold }
 *
 * Usage:
 *   logResult('catalog-load', {
 *     name: 'p(95) latency',
 *     value: 245,
 *     unit: 'ms',
 *     threshold: '< 300ms',
 *   });
 */
export function logResult(testName, metric) {
  const status = metric.status === 'pass' ? '✓' : '✗';
  console.log(
    `${status} [${testName}] ${metric.name}: ${metric.value} ${metric.unit} (${metric.threshold})`
  );
}

/**
 * Extract metric value from k6 summary
 * @param {object} summary - from default export in test
 * @param {string} metricPath - e.g. "http_req_duration.p(95)"
 * @returns {number}
 *
 * Usage (in test):
 *   export function setup() {
 *     const start = new Date();
 *     return { startTime: start };
 *   }
 *
 *   export function handleSummary(data) {
 *     const p95 = extractMetric(data, 'metrics.http_req_duration.values.p(95)');
 *     console.log(`p(95): ${p95}ms`);
 *   }
 */
export function extractMetric(summary, path) {
  const parts = path.split('.');
  let current = summary;

  for (const part of parts) {
    if (!current[part]) return null;
    current = current[part];
  }

  return current;
}

/**
 * Helper to build query string from object
 * @param {object} params - { page: 1, limit: 20 }
 * @returns {string} - "?page=1&limit=20"
 */
export function buildQuery(params) {
  const query = Object.entries(params)
    .filter(([_, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return query ? `?${query}` : '';
}

/**
 * Delay with jitter to avoid thundering herd
 * @param {number} baseMs - base delay in milliseconds
 * @param {number} jitterMs - random jitter
 *
 * Usage:
 *   import { sleep } from 'k6';
 *   sleep(Math.random() * 2);  // 0-2 seconds
 *   // Or:
 *   randomSleep(1000, 500);  // 1000 ± 500 ms
 */
export function randomSleep(baseMs, jitterMs) {
  const { sleep } = require('k6');
  const delay = (baseMs + Math.random() * jitterMs) / 1000;
  sleep(delay);
}

/**
 * Helper to verify threshold compliance
 * @param {object} thresholds - { 'http_req_duration.p(95)': '< 300' }
 * @param {object} actualValues - { 'http_req_duration.p(95)': 245 }
 * @returns {boolean} - true if all pass
 */
export function verifyThresholds(thresholds, actualValues) {
  let allPass = true;

  for (const [metric, threshold] of Object.entries(thresholds)) {
    const actual = actualValues[metric];
    // Parse threshold like "< 300" or "p(95) < 300"
    const passed = parseThreshold(threshold, actual);
    if (!passed) {
      console.error(`FAILED: ${metric} ${actual} does not meet ${threshold}`);
      allPass = false;
    }
  }

  return allPass;
}

/**
 * Parse and evaluate threshold expression
 * @param {string} threshold - e.g. "< 300" or "> 0.9"
 * @param {number} actual - actual value to test
 * @returns {boolean}
 */
function parseThreshold(threshold, actual) {
  threshold = threshold.trim();

  if (threshold.startsWith('< ')) {
    return actual < Number(threshold.slice(2));
  }
  if (threshold.startsWith('> ')) {
    return actual > Number(threshold.slice(2));
  }
  if (threshold.startsWith('<= ')) {
    return actual <= Number(threshold.slice(3));
  }
  if (threshold.startsWith('>= ')) {
    return actual >= Number(threshold.slice(3));
  }

  return false;
}

/**
 * Summary handler to format k6 results
 * Creates minimal JSON output for CI integration
 */
export function createSummaryHandler(testName) {
  return function (data) {
    const metrics = data.metrics;

    if (!metrics) {
      console.error('No metrics found');
      return {};
    }

    const summary = {
      test: testName,
      timestamp: new Date().toISOString(),
      passed: true,
      metrics: {},
    };

    // Extract key metrics
    if (metrics.http_req_duration) {
      const duration = metrics.http_req_duration.values;
      summary.metrics.p95_latency_ms = Math.round(duration['p(95)'] || 0);
      summary.metrics.p99_latency_ms = Math.round(duration['p(99)'] || 0);
      summary.metrics.avg_latency_ms = Math.round(duration.avg || 0);
    }

    if (metrics.http_reqs) {
      summary.metrics.total_requests = metrics.http_reqs.value;
    }

    if (metrics.http_req_failed) {
      summary.metrics.error_rate = (metrics.http_req_failed.value || 0);
      summary.passed = summary.passed && summary.metrics.error_rate === 0;
    }

    console.log(JSON.stringify(summary, null, 2));

    return {};
  };
}
