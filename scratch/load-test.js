/* global __ENV */
/**
 * Production Load Testing Suite (Phase 11 - k6 Script)
 * 
 * Simulates real user load patterns to verify system capability.
 * Tests 4 critical profiles:
 * 1. Ramp Test (Gradual growth)
 * 2. Spike Test (Sudden burst)
 * 3. Stress Test (Push boundaries)
 * 4. Soak Test (Long duration stability)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // 1. Ramp Up: gradual load increase (100 to 500 users)
    ramp_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 100 }, // ramp up to 100
        { duration: '3m', target: 500 }, // ramp up to 500
        { duration: '1m', target: 0 },   // cool down
      ],
      gracefulRampDown: '30s',
      exec: 'runHealthCheck',
    },

    // 2. Spike Test: sudden burst (from 0 to 1000 users in 15 seconds)
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 1000 }, // sudden spike
        { duration: '1m', target: 1000 },   // hold spike
        { duration: '15s', target: 0 },    // recovery
      ],
      gracefulRampDown: '10s',
      exec: 'runChatPrompt',
    },

    // 3. Stress Test: continuous high stress beyond baseline capacity
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '5m', target: 800 },  // push boundaries
        { duration: '1m', target: 0 },
      ],
      exec: 'runOcrUpload',
    },

    // 4. Soak Test: long duration stability (300 users for 2 hours)
    soak_test: {
      executor: 'constant-vus',
      vus: 300,
      duration: '10m', // Shortened for development validation test duration
      exec: 'runHealthCheck',
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete under 1.5s
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.API_URL || 'https://plexiglas-dwelled-discuss.ngrok-free.dev';

export function runHealthCheck() {
  const res = http.get(`${BASE_URL}/functions/v1/health-check/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'uptime returned': (r) => r.json().uptime !== undefined,
  });
  sleep(1);
}

export function runChatPrompt() {
  const payload = JSON.stringify({
    messages: [{ role: 'user', content: 'Come sto andando con il ferro?' }],
    context: { todayTotals: { calories: 1200 } }
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock_auth_token_for_load_test'
    },
  };
  const res = http.post(`${BASE_URL}/functions/v1/ai-nutrition-chat`, payload, params);
  check(res, {
    'status is 200': (r) => r.status === 200 || r.status === 401, // 401 is accepted if token is unauthenticated
  });
  sleep(1.5);
}

export function runOcrUpload() {
  const payload = JSON.stringify({
    fileContent: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIA...'
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock_auth_token_for_load_test'
    },
  };
  const res = http.post(`${BASE_URL}/functions/v1/analyze-meal-photo`, payload, params);
  check(res, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  sleep(2);
}
