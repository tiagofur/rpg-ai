#!/bin/bash
set -e

echo "🚀 Starting test environment..."

# Start services
docker-compose -f docker-compose.test.yml up -d mongodb-test redis-test

echo "⏳ Waiting for services to be healthy..."

# Wait for MongoDB
until docker-compose -f docker-compose.test.yml exec -T mongodb-test mongosh --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1; do
  echo "  Waiting for MongoDB..."
  sleep 2
done

# Wait for Redis
until docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping > /dev/null 2>&1; do
  echo "  Waiting for Redis..."
  sleep 2
done

echo "✅ Services are ready!"
echo ""
echo "📦 Running tests..."

# Run tests
docker-compose -f docker-compose.test.yml run --rm backend-test

# Capture exit code
TEST_EXIT_CODE=$?

echo ""
echo "🧹 Cleaning up..."

# Stop services
docker-compose -f docker-compose.test.yml down -v

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Tests failed with exit code $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE
