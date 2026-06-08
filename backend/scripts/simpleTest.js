import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

let authToken = '';

async function apiCall(method, endpoint, data = null, token = authToken) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (data && method !== 'GET') headers['Content-Type'] = 'application/json';
  
  const config = { method, url: `${API_URL}${endpoint}`, headers };
  if (data && method !== 'GET') config.data = data;
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('Simple API Health Check');
  console.log('========================================');
  
  // Test 1: Login
  console.log('\n1. Testing Login...');
  const login = await apiCall('POST', '/auth/login', {
    email: 'admin@hostelhub.pk',
    password: 'admin123'
  });
  if (login.success) {
    authToken = login.data.token;
    console.log('✅ Login successful');
  } else {
    console.log('❌ Login failed:', login.error);
    return;
  }
  
  // Test 2: Get current user
  console.log('\n2. Testing Get Current User...');
  const me = await apiCall('GET', '/auth/me');
  console.log(me.success ? '✅ Get current user successful' : '❌ Get current user failed:', me.error);
  
  // Test 3: Get hostels
  console.log('\n3. Testing Get Hostels...');
  const hostels = await apiCall('GET', '/hostels');
  console.log(hostels.success ? `✅ Get hostels successful (${hostels.data.length} hostels)` : '❌ Get hostels failed:', hostels.error);
  
  // Test 4: Get rooms
  console.log('\n4. Testing Get Rooms...');
  const rooms = await apiCall('GET', '/rooms');
  console.log(rooms.success ? `✅ Get rooms successful (${rooms.data.length} rooms)` : '❌ Get rooms failed:', rooms.error);
  
  // Test 5: Get beds
  console.log('\n5. Testing Get Beds...');
  const beds = await apiCall('GET', '/beds');
  console.log(beds.success ? `✅ Get beds successful (${beds.data.length} beds)` : '❌ Get beds failed:', beds.error);
  
  // Test 6: Get tenants
  console.log('\n6. Testing Get Tenants...');
  const tenants = await apiCall('GET', '/tenants');
  console.log(tenants.success ? `✅ Get tenants successful (${tenants.data.length} tenants)` : '❌ Get tenants failed:', tenants.error);
  
  // Test 7: Get payments
  console.log('\n7. Testing Get Payments...');
  const payments = await apiCall('GET', '/payments');
  console.log(payments.success ? `✅ Get payments successful (${payments.data.length} payments)` : '❌ Get payments failed:', payments.error);
  
  // Test 8: Get tickets
  console.log('\n8. Testing Get Tickets...');
  const tickets = await apiCall('GET', '/tickets');
  console.log(tickets.success ? `✅ Get tickets successful (${tickets.data.length} tickets)` : '❌ Get tickets failed:', tickets.error);
  
  // Test 9: Get users
  console.log('\n9. Testing Get Users...');
  const users = await apiCall('GET', '/users');
  console.log(users.success ? `✅ Get users successful (${users.data.length} users)` : '❌ Get users failed:', users.error);
  
  // Test 10: Create a simple user
  console.log('\n10. Testing Create User...');
  const timestamp = Date.now();
  const createUser = await apiCall('POST', '/users', {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'test123',
    role: 'manager',
    permissions: ['view_dashboard']
  });
  console.log(createUser.success ? '✅ Create user successful' : '❌ Create user failed:', createUser.error);
  
  // Test 11: Health check
  console.log('\n11. Testing Health Check...');
  const health = await apiCall('GET', '/health');
  console.log(health.success ? '✅ Health check successful' : '❌ Health check failed:', health.error);
  
  console.log('\n========================================');
  console.log('Test Complete');
  console.log('========================================');
}

runTests();
