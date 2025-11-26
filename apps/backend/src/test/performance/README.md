# Performance Tests (k6)

## Overview

This directory contains k6 load testing scripts for the RPG-AI backend.

## Prerequisites

1. **Install k6**: https://k6.io/docs/getting-started/installation/

   ```bash
   # Windows (chocolatey)
   choco install k6

   # macOS (homebrew)
   brew install k6

   # Linux (apt)
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Start backend server**:
   ```bash
   pnpm dev:backend
   ```

## Test Scripts

### 1. Authentication Load Test (`auth-load.js`)

Tests registration, login, and profile endpoints.

```bash
# Basic run
k6 run auth-load.js

# With custom VUs and duration
k6 run auth-load.js --vus 10 --duration 30s

# Against different environment
k6 run auth-load.js --env BASE_URL=https://api.staging.rpg-ai.com
```

**Metrics:**

- `login_duration` - Time to complete login
- `register_duration` - Time to complete registration
- `login_error_rate` - Percentage of failed logins
- `successful_logins` - Counter of successful logins

### 2. Game Load Test (`game-load.js`)

Tests game session creation, actions, and character operations.

```bash
# Basic run
k6 run game-load.js

# With test user credentials
k6 run game-load.js --env TEST_EMAIL=test@example.com --env TEST_PASSWORD=secret123

# Heavy load test
k6 run game-load.js --vus 20 --duration 2m
```

**Metrics:**

- `session_creation_success` - Rate of successful session creation
- `action_duration` - Time to process game actions
- `ai_response_duration` - AI response latency
- `game_errors` - Counter of game-related errors

### 3. WebSocket Load Test (`websocket-load.js`)

Tests real-time WebSocket connections.

```bash
# Basic run
k6 run websocket-load.js

# With custom WebSocket URL
k6 run websocket-load.js --env WS_URL=ws://localhost:3333
```

**Metrics:**

- `ws_connections` - Total connections established
- `ws_connection_errors` - Failed connections
- `ws_connection_time` - Time to establish connection
- `ws_message_latency` - Round-trip message time

## Test Thresholds

All tests have built-in thresholds:

| Metric                     | Threshold      | Description                    |
| -------------------------- | -------------- | ------------------------------ |
| `http_req_duration`        | p(95) < 2000ms | 95% of requests under 2s       |
| `login_error_rate`         | < 10%          | Less than 10% login failures   |
| `session_creation_success` | > 90%          | At least 90% sessions created  |
| `ws_connection_time`       | p(95) < 2000ms | 95% of WS connections under 2s |

## Output

Each test generates:

- Console summary with key metrics
- JSON results file (e.g., `auth-load-results.json`)

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Run Load Tests
  run: |
    k6 run apps/backend/src/test/performance/auth-load.js \
      --vus 5 --duration 30s \
      --out json=k6-results.json
```

## Tips

1. **Start small**: Begin with 5 VUs and 30s duration
2. **Monitor backend**: Watch server CPU/memory during tests
3. **Use scenarios**: Define realistic user patterns
4. **Save results**: Export JSON for trend analysis

## Recommended Load Profiles

| Environment | VUs   | Duration | Notes                  |
| ----------- | ----- | -------- | ---------------------- |
| Local Dev   | 5-10  | 30s      | Quick smoke test       |
| Staging     | 20-50 | 2m       | Pre-release validation |
| Production  | 100+  | 5m+      | Capacity planning      |
