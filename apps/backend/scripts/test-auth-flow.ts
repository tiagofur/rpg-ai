/* eslint-disable no-console */
import { fetch } from 'undici';

const BASE_URL = 'http://localhost:3333';

async function testAuth() {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const username = `user${timestamp}`;
    const password = 'Password123!';

    console.log(`Testing with: ${email} / ${username}`);

    // 1. Register
    console.log('1. Registering...');
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
    });

    if (!registerRes.ok) {
        const err = await registerRes.text();
        throw new Error(`Register failed: ${registerRes.status} ${err}`);
    }
    const registerData = await registerRes.json();
    console.log('✅ Register success:', registerData);

    // 2. Login
    console.log('2. Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!loginRes.ok) {
        const err = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status} ${err}`);
    }
    const loginData = await loginRes.json() as { accessToken?: string };
    console.log('✅ Login success');

    if (!loginData.accessToken) {
        throw new Error('No access token received');
    }
    console.log('Access Token received');

    return loginData;
}

testAuth().catch(console.error);
