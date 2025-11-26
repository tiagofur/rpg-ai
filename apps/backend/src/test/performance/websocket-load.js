/**
 * k6 WebSocket Load Testing Script
 *
 * Tests real-time game communication via WebSocket
 *
 * Run with: k6 run websocket-load.js
 *
 * Prerequisites:
 * - Install k6: https://k6.io/docs/getting-started/installation/
 * - Start backend server: pnpm dev:backend
 */

import { check, sleep } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const wsConnections = new Counter('ws_connections');
const wsConnectionErrors = new Counter('ws_connection_errors');
const wsMessagesSent = new Counter('ws_messages_sent');
const wsMessagesReceived = new Counter('ws_messages_received');
const wsConnectionTime = new Trend('ws_connection_time');
const wsMessageLatency = new Trend('ws_message_latency');

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    ws_connection_time: ['p(95)<2000'],
    ws_message_latency: ['p(95)<1000'],
  },
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:3333';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export default function () {
  const startTime = Date.now();

  // Note: In a real test, you'd authenticate first and get a token
  // For now, we'll test the connection itself

  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;

  const ws = new WebSocket(url);

  ws.onopen = () => {
    wsConnections.add(1);
    wsConnectionTime.add(Date.now() - startTime);
    console.log(`VU ${__VU}: Connected`);

    // Send Socket.io handshake
    ws.send('40');
    wsMessagesSent.add(1);
  };

  ws.onmessage = (e) => {
    wsMessagesReceived.add(1);
    console.log(`VU ${__VU}: Received: ${e.data.substring(0, 50)}...`);

    // Handle Socket.io protocol
    if (e.data === '40') {
      // Connected, send a test event
      const pingTime = Date.now();
      ws.send('42["ping",{}]');
      wsMessagesSent.add(1);
    }

    if (e.data.startsWith('42')) {
      // Event received, calculate latency
      // In a real test, you'd parse the timestamp from the message
    }
  };

  ws.onerror = (e) => {
    wsConnectionErrors.add(1);
    console.error(`VU ${__VU}: Error: ${e.message || 'Unknown error'}`);
  };

  ws.onclose = () => {
    console.log(`VU ${__VU}: Disconnected`);
  };

  // Keep connection alive for some time
  sleep(10);

  // Clean up
  ws.close();
}

export function handleSummary(data) {
  const { metrics } = data;
  const lines = [
    '=== RPG-AI WebSocket Load Test Results ===',
    '',
    `Total connections: ${metrics.ws_connections?.values?.count || 0}`,
    `Connection errors: ${metrics.ws_connection_errors?.values?.count || 0}`,
    `Messages sent: ${metrics.ws_messages_sent?.values?.count || 0}`,
    `Messages received: ${metrics.ws_messages_received?.values?.count || 0}`,
    '',
    `Avg connection time: ${Math.round(metrics.ws_connection_time?.values?.avg || 0)}ms`,
    `95th percentile connection: ${Math.round(metrics.ws_connection_time?.values?.['p(95)'] || 0)}ms`,
    '',
  ];

  return {
    stdout: lines.join('\n'),
    'websocket-load-results.json': JSON.stringify(data, null, 2),
  };
}
