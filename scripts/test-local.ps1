# PowerShell script for running tests locally on Windows
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting test environment..." -ForegroundColor Cyan

# Start services
docker-compose -f docker-compose.test.yml up -d mongodb-test redis-test

Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow

# Wait for MongoDB
$mongoReady = $false
$attempts = 0
$maxAttempts = 30

while (-not $mongoReady -and $attempts -lt $maxAttempts) {
    try {
        docker-compose -f docker-compose.test.yml exec -T mongodb-test mongosh --eval "db.runCommand({ ping: 1 })" 2>&1 | Out-Null
        $mongoReady = $true
        Write-Host "  ✓ MongoDB is ready" -ForegroundColor Green
    }
    catch {
        Write-Host "  Waiting for MongoDB... ($attempts/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $attempts++
    }
}

if (-not $mongoReady) {
    Write-Host "❌ MongoDB failed to start" -ForegroundColor Red
    docker-compose -f docker-compose.test.yml down -v
    exit 1
}

# Wait for Redis
$redisReady = $false
$attempts = 0

while (-not $redisReady -and $attempts -lt $maxAttempts) {
    try {
        $result = docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping 2>&1
        if ($result -match "PONG") {
            $redisReady = $true
            Write-Host "  ✓ Redis is ready" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  Waiting for Redis... ($attempts/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $attempts++
    }
}

if (-not $redisReady) {
    Write-Host "❌ Redis failed to start" -ForegroundColor Red
    docker-compose -f docker-compose.test.yml down -v
    exit 1
}

Write-Host ""
Write-Host "📦 Running tests..." -ForegroundColor Cyan

# Run tests
docker-compose -f docker-compose.test.yml run --rm backend-test

$testExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow

# Stop services
docker-compose -f docker-compose.test.yml down -v

if ($testExitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
}
else {
    Write-Host "❌ Tests failed with exit code $testExitCode" -ForegroundColor Red
}

exit $testExitCode
