/**
 * k6 Load Testing Script - Game Endpoints
 *
 * Run with: k6 run game-load.js
 *
 * Prerequisites:
 * - Install k6: https://k6.io/docs/getting-started/installation/
 * - Start backend server: pnpm dev:backend
 * - Have a test user created
 *
 * Options:
 * - k6 run game-load.js --vus 5 --duration 30s
 * - k6 run game-load.js --vus 20 --duration 2m
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { WebSocket } from 'k6/experimental/websockets';

// Custom metrics
const sessionCreationRate = new Rate('session_creation_success');
const actionDuration = new Trend('action_duration');
const aiResponseDuration = new Trend('ai_response_duration');
const gameErrors = new Counter('game_errors');

// Test configuration
export const options = {
  stages: [
    { duration: '20s', target: 5 }, // Ramp up to 5 users
    { duration: '1m', target: 5 }, // Stay at 5 users
    { duration: '20s', target: 15 }, // Ramp up to 15 users
    { duration: '1m', target: 15 }, // Stay at 15 users
    { duration: '20s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests < 5s (AI can be slow)
    session_creation_success: ['rate>0.9'], // 90% success rate
    action_duration: ['p(95)<3000'], // 95% of actions < 3s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

// Pre-created test user (create before running tests)
const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'gametest@example.com',
  password: __ENV.TEST_PASSWORD || 'TestPassword123!',
};

// Store auth token between iterations
let authToken = null;
let characterId = null;

export function setup() {
  // Create test user and character before load test
  console.log('Setting up test user...');

  // Register user (may fail if exists, that's ok)
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      email: TEST_USER.email,
      username: 'gametest_user',
      password: TEST_USER.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  // Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status !== 200) {
    console.error('Failed to login test user');
    return null;
  }

  const loginData = JSON.parse(loginRes.body);
  const token = loginData.data.accessToken;

  // Get or create character
  const charactersRes = http.get(`${BASE_URL}/api/character`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  let charId = null;
  if (charactersRes.status === 200) {
    const chars = JSON.parse(charactersRes.body);
    if (chars.data && chars.data.length > 0) {
      charId = chars.data[0].id;
    }
  }

  // Create character if none exists
  if (!charId) {
    const createCharRes = http.post(
      `${BASE_URL}/api/character`,
      JSON.stringify({
        name: 'LoadTestHero',
        race: 'human',
        class: 'warrior',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (createCharRes.status === 200 || createCharRes.status === 201) {
      const charData = JSON.parse(createCharRes.body);
      charId = charData.data.id;
    }
  }

  return { token, characterId: charId };
}

export default function (data) {
  if (!data || !data.token) {
    console.error('No auth token available');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('Game Session Management', function () {
    // Create new game session
    const createSessionRes = http.post(
      `${BASE_URL}/api/game/session`,
      JSON.stringify({
        characterId: data.characterId,
        scenario: 'default',
      }),
      { headers }
    );

    const sessionCreated = check(createSessionRes, {
      'session created successfully': (r) => r.status === 200 || r.status === 201,
      'session has id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.id;
        } catch {
          return false;
        }
      },
    });

    sessionCreationRate.add(sessionCreated);

    if (!sessionCreated) {
      gameErrors.add(1);
      return;
    }

    const sessionId = JSON.parse(createSessionRes.body).data.id;
    sleep(0.5);

    // Get session state
    const getSessionRes = http.get(`${BASE_URL}/api/game/session/${sessionId}`, { headers });

    check(getSessionRes, {
      'get session successful': (r) => r.status === 200,
    });

    sleep(0.5);
  });

  group('Game Actions', function () {
    // List sessions first
    const listRes = http.get(`${BASE_URL}/api/game/session`, { headers });

    if (listRes.status !== 200) {
      return;
    }

    const sessions = JSON.parse(listRes.body);
    if (!sessions.data || sessions.data.length === 0) {
      return;
    }

    const sessionId = sessions.data[0].id;

    // Send various game actions
    const actions = ['look around', 'search', 'move forward'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const startTime = Date.now();
    const actionRes = http.post(
      `${BASE_URL}/api/game/action`,
      JSON.stringify({
        sessionId,
        action,
      }),
      { headers, timeout: '30s' }
    );

    const actionDurationMs = Date.now() - startTime;
    actionDuration.add(actionDurationMs);

    const actionSuccess = check(actionRes, {
      'action processed': (r) => r.status === 200,
      'action has narration': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.narration;
        } catch {
          return false;
        }
      },
    });

    if (!actionSuccess) {
      gameErrors.add(1);
    } else {
      // Track AI response time if available
      try {
        const body = JSON.parse(actionRes.body);
        if (body.data && body.data.processingTime) {
          aiResponseDuration.add(body.data.processingTime);
        }
      } catch {}
    }

    sleep(2); // Wait between actions to simulate real user behavior
  });

  group('Character Operations', function () {
    // Get character details
    if (data.characterId) {
      const charRes = http.get(`${BASE_URL}/api/character/${data.characterId}`, { headers });

      check(charRes, {
        'character fetch successful': (r) => r.status === 200,
        'character has stats': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.stats;
          } catch {
            return false;
          }
        },
      });
    }

    sleep(1);
  });
}

export function handleSummary(data) {
  const { metrics } = data;
  const lines = [
    '=== RPG-AI Game Load Test Results ===',
    '',
    `Total requests: ${metrics.http_reqs?.values?.count || 0}`,
    `Failed requests: ${Math.round((metrics.http_req_failed?.values?.rate || 0) * 100)}%`,
    `Avg request duration: ${Math.round(metrics.http_req_duration?.values?.avg || 0)}ms`,
    `95th percentile duration: ${Math.round(metrics.http_req_duration?.values?.['p(95)'] || 0)}ms`,
    '',
    `Session creation success: ${((metrics.session_creation_success?.values?.rate || 0) * 100).toFixed(2)}%`,
    `Game errors: ${metrics.game_errors?.values?.count || 0}`,
    `Avg action duration: ${Math.round(metrics.action_duration?.values?.avg || 0)}ms`,
    `Avg AI response: ${Math.round(metrics.ai_response_duration?.values?.avg || 0)}ms`,
    '',
  ];

  return {
    stdout: lines.join('\n'),
    'game-load-results.json': JSON.stringify(data, null, 2),
  };
}
