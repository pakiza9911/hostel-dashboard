import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function apiCall(method, endpoint, data = null, token = null) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`Token being sent: ${token.substring(0, 50)}...`);
  }
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
      status: error.response?.status,
      details: error.response?.data
    };
  }
}

async function testPostOperations() {
  console.log('========================================');
  console.log('Testing POST Operations');
  console.log('========================================');
  
  const timestamp = Date.now();
  
  // Login once and use the same token
  console.log('\n0. Login...');
  const login = await apiCall('POST', '/auth/login', {
    email: 'admin@hostelhub.pk',
    password: 'admin123'
  });
  if (!login.success) {
    console.log('❌ Login failed:', login.error);
    return;
  }
  const token = login.data.token;
  console.log('✅ Login successful, token length:', token.length);
  
  // Create owner
  console.log('\n1. Create owner...');
  const owner = await apiCall('POST', '/users', {
    name: 'Test Owner',
    email: `owner${timestamp}@test.com`,
    password: 'owner123',
    role: 'owner',
    permissions: ['view_dashboard']
  }, token);
  console.log(owner.success ? '✅ Owner created' : '❌ Owner failed:', owner.error);
  
  if (!owner.success) return;
  const ownerId = owner.data.id;
  
  // Create hostel
  console.log('\n2. Create hostel...');
  const hostel = await apiCall('POST', '/hostels', {
    name: 'Test Hostel',
    city: 'Lahore',
    address: '123 Test St',
    ownerId
  }, token);
  console.log(hostel.success ? '✅ Hostel created' : '❌ Hostel failed:', hostel.error);
  
  if (!hostel.success) return;
  const hostelId = hostel.data.id;
  
  // Create room
  console.log('\n3. Create room...');
  console.log('Hostel ID:', hostelId);
  const room = await apiCall('POST', '/rooms', {
    hostelId,
    number: '101',
    floor: 1,
    capacity: 4,
    type: 'dormitory',
    rentPerBed: 5000
  }, token);
  console.log(room.success ? '✅ Room created' : '❌ Room failed:', room.error);
  if (!room.success) {
    console.log('Details:', room.details);
  }
  
  if (!room.success) return;
  const roomId = room.data.id;
  
  // Create bed
  console.log('\n4. Create bed...');
  const bed = await apiCall('POST', '/beds', {
    roomId,
    hostelId,
    label: 'A1',
    price: 5000
  }, token);
  console.log(bed.success ? '✅ Bed created' : '❌ Bed failed:', bed.error);
  
  if (!bed.success) return;
  const bedId = bed.data.id;
  
  // Create tenant
  console.log('\n5. Create tenant...');
  const tenant = await apiCall('POST', '/tenants', {
    name: 'Test Tenant',
    email: `tenant${timestamp}@test.com`,
    phone: '+92-300-1234567',
    cnic: '12345-6789012-3',
    bedId,
    hostelId,
    checkInDate: new Date().toISOString().split('T')[0]
  }, token);
  console.log(tenant.success ? '✅ Tenant created' : '❌ Tenant failed:', tenant.error);
  
  if (!tenant.success) return;
  const tenantId = tenant.data.id;
  
  // Create payment
  console.log('\n6. Create payment...');
  const payment = await apiCall('POST', '/payments', {
    tenantId,
    hostelId,
    amount: 5000,
    monthFor: new Date().toISOString().slice(0, 7),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending'
  }, token);
  console.log(payment.success ? '✅ Payment created' : '❌ Payment failed:', payment.error);
  
  // Create ticket
  console.log('\n7. Create ticket...');
  const ticket = await apiCall('POST', '/tickets', {
    title: 'Test Issue',
    description: 'Test description',
    category: 'plumbing',
    priority: 'medium',
    hostelId,
    roomId
  }, token);
  console.log(ticket.success ? '✅ Ticket created' : '❌ Ticket failed:', ticket.error);
  
  console.log('\n========================================');
  console.log('POST Operations Test Complete');
  console.log('========================================');
}

testPostOperations();
