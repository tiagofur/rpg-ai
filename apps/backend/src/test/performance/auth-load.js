/**
 * k6 Load Testing Script - Authentication Endpoints
 *
 * Run with: k6 run auth-load.js
 *
 * Prerequisites:
 * - Install k6: https://k6.io/docs/getting-started/installation/
 * - Start backend server: pnpm dev:backend
 *
 * Options:
 * - k6 run auth-load.js --vus 10 --duration 30s
 * - k6 run auth-load.js --vus 50 --duration 1m
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginErrorRate = new Rate('login_error_rate');
const registerErrorRate = new Rate('register_error_rate');
const loginDuration = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const successfulLogins = new Counter('successful_logins');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 25 }, // Ramp up to 25 users
    { duration: '1m', target: 25 }, // Stay at 25 users
    { duration: '30s', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
    login_error_rate: ['rate<0.1'], // Error rate < 10%
    login_duration: ['p(95)<1500'], // 95% of logins < 1.5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

// Unique user generator for each VU
function generateTestUser() {
  const timestamp = Date.now();
  const vuId = __VU;
  const iterationId = __ITER;
  return {
    email: `loadtest_${vuId}_${iterationId}_${timestamp}@test.com`,
    username: `loaduser_${vuId}_${iterationId}_${timestamp}`,
    password: 'TestPassword123!',
  };
}

export default function () {
  const user = generateTestUser();

  group('Registration Flow', function () {
    const registerPayload = JSON.stringify({
      email: user.email,
      username: user.username,
      password: user.password,
    });

    const registerRes = http.post(`${BASE_URL}/api/auth/register`, registerPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const registerSuccess = check(registerRes, {
      'register status is 201 or 200': (r) => r.status === 201 || r.status === 200,
      'register has user data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.user;
        } catch {
          return false;
        }
      },
    });

    registerErrorRate.add(!registerSuccess);
    registerDuration.add(registerRes.timings.duration);

    sleep(0.5);
  });

  group('Login Flow', function () {
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.accessToken;
        } catch {
          return false;
        }
      },
    });

    loginErrorRate.add(!loginSuccess);
    loginDuration.add(loginRes.timings.duration);

    if (loginSuccess) {
      successfulLogins.add(1);

      // Test authenticated endpoint
      const token = JSON.parse(loginRes.body).data.accessToken;

      const profileRes = http.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      check(profileRes, {
        'profile request successful': (r) => r.status === 200,
        'profile has user info': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.email;
          } catch {
            return false;
          }
        },
      });
    }

    sleep(1);
  });

  group('Invalid Login Attempts', function () {
    const invalidPayload = JSON.stringify({
      email: 'nonexistent@test.com',
      password: 'wrongpassword',
    });

    const invalidRes = http.post(`${BASE_URL}/api/auth/login`, invalidPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(invalidRes, {
      'invalid login returns 401': (r) => r.status === 401,
    });

    sleep(0.5);
  });
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'auth-load-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  const lines = [
    '=== RPG-AI Auth Load Test Results ===',
    '',
    `Total requests: ${metrics.http_reqs?.values?.count || 0}`,
    `Failed requests: ${metrics.http_req_failed?.values?.rate || 0}`,
    `Avg request duration: ${Math.round(metrics.http_req_duration?.values?.avg || 0)}ms`,
    `95th percentile duration: ${Math.round(metrics.http_req_duration?.values?.['p(95)'] || 0)}ms`,
    '',
    `Successful logins: ${metrics.successful_logins?.values?.count || 0}`,
    `Login error rate: ${((metrics.login_error_rate?.values?.rate || 0) * 100).toFixed(2)}%`,
    `Register error rate: ${((metrics.register_error_rate?.values?.rate || 0) * 100).toFixed(2)}%`,
    '',
  ];

  return lines.join('\n');
}
