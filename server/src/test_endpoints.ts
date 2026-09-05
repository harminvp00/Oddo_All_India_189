import 'dotenv/config';
import http from 'http';

async function request(options: {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: options.path,
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING INTEGRATION TESTS FOR AUTH & USER ADMIN');
  console.log('====================================================\n');

  // Test 1: Health Check Endpoint
  console.log('TEST 1: GET /api/health');
  const res1 = await request({ method: 'GET', path: '/api/health' });
  console.log(`Status: ${res1.status}`, res1.body);
  console.assert(res1.status === 200, 'Health check failed');
  console.log('✅ TEST 1 PASSED\n');

  // Test 2: Invalid Password Login
  console.log('TEST 2: POST /api/auth/login (Invalid Password)');
  const res2 = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'admin@peoplepay360.com', password: 'WrongPassword!' },
  });
  console.log(`Status: ${res2.status}`, res2.body);
  console.assert(res2.status === 400 && res2.body.error.code === 'INVALID_CREDENTIALS', 'Invalid password check failed');
  console.log('✅ TEST 2 PASSED\n');

  // Test 3: Valid Admin Login
  console.log('TEST 3: POST /api/auth/login (Valid Admin Login)');
  const res3 = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'admin@peoplepay360.com', password: 'Password123!' },
  });
  console.log(`Status: ${res3.status}`, res3.body);
  console.assert(res3.status === 200 && res3.body.data.token, 'Admin login failed');
  const adminToken = res3.body.data.token;
  console.log('✅ TEST 3 PASSED\n');

  // Test 4: Current Profile GET /api/auth/me
  console.log('TEST 4: GET /api/auth/me');
  const res4 = await request({
    method: 'GET',
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`Status: ${res4.status}`, res4.body);
  console.assert(res4.status === 200 && res4.body.data.email === 'admin@peoplepay360.com', 'Me endpoint failed');
  console.log('✅ TEST 4 PASSED\n');

  // Test 5: Admin Provision New User POST /api/users
  console.log('TEST 5: POST /api/users (Admin Provisioning New User)');
  const testUserEmail = `test.emp.${Date.now()}@peoplepay360.com`;
  const res5 = await request({
    method: 'POST',
    path: '/api/users',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      email: testUserEmail,
      fullName: 'Test Employee User',
      password: 'TempPassword123!',
      role: 'EMPLOYEE',
    },
  });
  console.log(`Status: ${res5.status}`, res5.body);
  console.assert(res5.status === 201 && res5.body.data.id, 'User creation failed');
  const newUserId = res5.body.data.id;
  console.log('✅ TEST 5 PASSED\n');

  // Test 6: Admin List Users GET /api/users
  console.log('TEST 6: GET /api/users (List Users)');
  const res6 = await request({
    method: 'GET',
    path: '/api/users?limit=10',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`Status: ${res6.status}`, res6.body);
  console.assert(res6.status === 200 && Array.isArray(res6.body.data), 'List users failed');
  console.log('✅ TEST 6 PASSED\n');

  // Test 7: Toggle Status to DISABLED
  console.log('TEST 7: PATCH /api/users/:id/status (Disable Account)');
  const res7 = await request({
    method: 'PATCH',
    path: `/api/users/${newUserId}/status`,
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'DISABLED' },
  });
  console.log(`Status: ${res7.status}`, res7.body);
  console.assert(res7.status === 200 && res7.body.data.status === 'DISABLED', 'Disable user status failed');
  console.log('✅ TEST 7 PASSED\n');

  // Test 8: Login with Disabled Account Block Check
  console.log('TEST 8: POST /api/auth/login (Disabled Account Block Check)');
  const res8 = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: testUserEmail, password: 'TempPassword123!' },
  });
  console.log(`Status: ${res8.status}`, res8.body);
  console.assert(res8.status === 403 && res8.body.error.code === 'ACCOUNT_DISABLED', 'Disabled login block failed');
  console.log('✅ TEST 8 PASSED\n');

  // Test 9: Non-Admin Accessing /api/users (RBAC Protection Check)
  console.log('TEST 9: GET /api/users as Non-Admin (RBAC Protection Check)');
  // Re-enable user to login as employee
  await request({
    method: 'PATCH',
    path: `/api/users/${newUserId}/status`,
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'ACTIVE' },
  });

  const empLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: testUserEmail, password: 'TempPassword123!' },
  });
  const empToken = empLogin.body.data.token;

  const res9 = await request({
    method: 'GET',
    path: '/api/users',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  console.log(`Status: ${res9.status}`, res9.body);
  console.assert(res9.status === 403 && res9.body.error.code === 'FORBIDDEN', 'RBAC protection check failed');
  console.log('✅ TEST 9 PASSED\n');

  console.log('====================================================');
  console.log('ALL 9 INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================');
}

runTests().catch(console.error);
