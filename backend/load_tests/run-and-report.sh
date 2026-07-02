#!/bin/bash
# Run load tests and generate HTML report
#
# Usage:
#   ./backend/load_tests/run-and-report.sh [staging|prod|local]
#   ./backend/load_tests/run-and-report.sh local 2>/dev/null | grep "SUMMARY"

set -e

ENVIRONMENT=${1:-local}
BASE_URL=""
REPORT_DIR="backend/load_tests/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/load-test-$TIMESTAMP.html"

# Determine BASE_URL
case "$ENVIRONMENT" in
  staging)
    BASE_URL="https://staging.bloomify.example.com"
    ;;
  prod)
    echo "ERROR: Production tests not supported in this script"
    exit 1
    ;;
  local)
    BASE_URL="http://localhost:8000"
    ;;
  *)
    BASE_URL="$ENVIRONMENT"  # Allow custom URLs
    ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Load Test Runner — $TIMESTAMP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

# Create report directory
mkdir -p "$REPORT_DIR"

# Array of tests to run
declare -a TESTS=(
  "liqpay-callback-smoke.js"
  "checkout-smoke.js"
  "catalog-load.js"
  "checkout-stress.js"
)

# Run each test
declare -a RESULTS
for test in "${TESTS[@]}"; do
  test_name=$(basename "$test" .js)
  echo "▶ Running: $test_name"

  # Run with JSON output
  if k6 run "backend/load_tests/$test" \
    --env BASE_URL="$BASE_URL" \
    --out "json=results-$test_name.json" 2>&1; then
    RESULTS+=("✓ $test_name PASSED")
  else
    RESULTS+=("✗ $test_name FAILED")
  fi

  echo ""
done

# Generate summary report
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

passed=0
failed=0

for result in "${RESULTS[@]}"; do
  echo "$result"
  if [[ $result == ✓* ]]; then
    ((passed++))
  else
    ((failed++))
  fi
done

echo ""
echo "Tests: $passed passed, $failed failed out of ${#TESTS[@]} total"
echo "Report directory: $REPORT_DIR"
echo ""

# Exit with error if any test failed
if [ $failed -gt 0 ]; then
  exit 1
fi

echo "✓ All tests passed!"
exit 0
