import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

let authToken = '';
let hostelId = '';
let roomId = '';
let bedId = '';
let tenantId = '';
let paymentId = '';
let ticketId = '';
let ownerId = '';
let managerId = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = authToken) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (data && method !== 'GET') headers['Content-Type'] = 'application/json';
  
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers
  };
  
  if (data && method !== 'GET') {
    config.data = data;
  }
  
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

// Test functions
async function testLogin() {
  console.log('\n=== Testing Login ===');
  const result = await apiCall('POST', '/auth/login', {
    email: 'admin@hostelhub.pk',
    password: 'admin123'
  });
  
  if (result.success) {
    authToken = result.data.token;
    console.log('✅ Login successful');
    console.log('User:', result.data.user);
  } else {
    console.log('❌ Login failed:', result.error);
  }
  return result.success;
}

async function testCreateHostel() {
  console.log('\n=== Testing Create Hostel ===');
  // First create an owner user
  const ownerResult = await apiCall('POST', '/users', {
    name: 'Hostel Owner',
    email: 'hostelowner@test.com',
    password: 'owner123',
    role: 'owner',
    permissions: ['view_dashboard', 'manage_rooms', 'manage_tenants', 'manage_payments', 'manage_maintenance']
  });
  
  if (!ownerResult.success) {
    console.log('❌ Create owner failed:', ownerResult.error);
    return false;
  }
  
  ownerId = ownerResult.data.id;
  console.log('✅ Owner created:', ownerResult.data);
  
  // Now create hostel with owner
  const result = await apiCall('POST', '/hostels', {
    name: 'Test Hostel',
    city: 'Lahore',
    address: '123 Main Street',
    phone: '+92-300-1234567',
    email: 'test@hostel.com',
    totalRooms: 10,
    totalBeds: 40,
    facilities: ['wifi', 'ac', 'food'],
    ownerId
  });
  
  if (result.success) {
    hostelId = result.data.id;
    console.log('✅ Hostel created:', result.data);
  } else {
    console.log('❌ Create hostel failed:', result.error);
  }
  return result.success;
}

async function testGetHostels() {
  console.log('\n=== Testing Get Hostels ===');
  const result = await apiCall('GET', '/hostels');
  
  if (result.success) {
    console.log('✅ Get hostels successful, count:', result.data.length);
  } else {
    console.log('❌ Get hostels failed:', result.error);
  }
  return result.success;
}

async function testCreateRoom() {
  console.log('\n=== Testing Create Room ===');
  const result = await apiCall('POST', '/rooms', {
    hostelId,
    roomNumber: '101',
    floor: 1,
    capacity: 4,
    type: 'dormitory',
    facilities: ['ac', 'wifi']
  });
  
  if (result.success) {
    roomId = result.data.id;
    console.log('✅ Room created:', result.data);
  } else {
    console.log('❌ Create room failed:', result.error);
  }
  return result.success;
}

async function testGetRooms() {
  console.log('\n=== Testing Get Rooms ===');
  const result = await apiCall('GET', '/rooms');
  
  if (result.success) {
    console.log('✅ Get rooms successful, count:', result.data.length);
  } else {
    console.log('❌ Get rooms failed:', result.error);
  }
  return result.success;
}

async function testCreateBed() {
  console.log('\n=== Testing Create Bed ===');
  const result = await apiCall('POST', '/beds', {
    roomId,
    hostelId,
    label: 'A1',
    price: 5000
  });
  
  if (result.success) {
    bedId = result.data.id;
    console.log('✅ Bed created:', result.data);
  } else {
    console.log('❌ Create bed failed:', result.error);
  }
  return result.success;
}

async function testGetBeds() {
  console.log('\n=== Testing Get Beds ===');
  const result = await apiCall('GET', '/beds');
  
  if (result.success) {
    console.log('✅ Get beds successful, count:', result.data.length);
  } else {
    console.log('❌ Get beds failed:', result.error);
  }
  return result.success;
}

async function testCreateTenant() {
  console.log('\n=== Testing Create Tenant ===');
  const result = await apiCall('POST', '/tenants', {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+92-300-7654321',
    cnic: '12345-6789012-3',
    bedId,
    hostelId,
    checkInDate: new Date().toISOString().split('T')[0]
  });
  
  if (result.success) {
    tenantId = result.data.id;
    console.log('✅ Tenant created:', result.data);
  } else {
    console.log('❌ Create tenant failed:', result.error);
  }
  return result.success;
}

async function testGetTenants() {
  console.log('\n=== Testing Get Tenants ===');
  const result = await apiCall('GET', '/tenants');
  
  if (result.success) {
    console.log('✅ Get tenants successful, count:', result.data.length);
  } else {
    console.log('❌ Get tenants failed:', result.error);
  }
  return result.success;
}

async function testCreatePayment() {
  console.log('\n=== Testing Create Payment ===');
  const result = await apiCall('POST', '/payments', {
    tenantId,
    hostelId,
    amount: 5000,
    monthFor: new Date().toISOString().slice(0, 7),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending'
  });
  
  if (result.success) {
    paymentId = result.data.id;
    console.log('✅ Payment created:', result.data);
  } else {
    console.log('❌ Create payment failed:', result.error);
  }
  return result.success;
}

async function testGetPayments() {
  console.log('\n=== Testing Get Payments ===');
  const result = await apiCall('GET', '/payments');
  
  if (result.success) {
    console.log('✅ Get payments successful, count:', result.data.length);
  } else {
    console.log('❌ Get payments failed:', result.error);
  }
  return result.success;
}

async function testMarkPaymentPaid() {
  console.log('\n=== Testing Mark Payment Paid ===');
  const result = await apiCall('PATCH', `/payments/${paymentId}/paid`);
  
  if (result.success) {
    console.log('✅ Payment marked as paid:', result.data);
  } else {
    console.log('❌ Mark payment paid failed:', result.error);
  }
  return result.success;
}

async function testCreateTicket() {
  console.log('\n=== Testing Create Maintenance Ticket ===');
  const result = await apiCall('POST', '/tickets', {
    title: 'Leaking faucet',
    description: 'Water dripping from bathroom faucet',
    category: 'plumbing',
    priority: 'medium',
    hostelId,
    roomId
  });
  
  if (result.success) {
    ticketId = result.data.id;
    console.log('✅ Ticket created:', result.data);
  } else {
    console.log('❌ Create ticket failed:', result.error);
  }
  return result.success;
}

async function testGetTickets() {
  console.log('\n=== Testing Get Tickets ===');
  const result = await apiCall('GET', '/tickets');
  
  if (result.success) {
    console.log('✅ Get tickets successful, count:', result.data.length);
  } else {
    console.log('❌ Get tickets failed:', result.error);
  }
  return result.success;
}

async function testCreateManager() {
  console.log('\n=== Testing Create Manager User ===');
  const result = await apiCall('POST', '/users', {
    name: 'Test Manager',
    email: 'manager@hostel.com',
    password: 'manager123',
    role: 'manager',
    hostelId,
    permissions: ['view_dashboard', 'manage_rooms', 'manage_tenants', 'manage_payments', 'manage_maintenance']
  });
  
  if (result.success) {
    managerId = result.data.id;
    console.log('✅ Manager created:', result.data);
  } else {
    console.log('❌ Create manager failed:', result.error);
  }
  return result.success;
}

async function testGetUsers() {
  console.log('\n=== Testing Get Users ===');
  const result = await apiCall('GET', '/users');
  
  if (result.success) {
    console.log('✅ Get users successful, count:', result.data.length);
  } else {
    console.log('❌ Get users failed:', result.error);
  }
  return result.success;
}

async function testGetMe() {
  console.log('\n=== Testing Get Current User ===');
  const result = await apiCall('GET', '/auth/me');
  
  if (result.success) {
    console.log('✅ Get current user successful:', result.data);
  } else {
    console.log('❌ Get current user failed:', result.error);
  }
  return result.success;
}

async function testUpdateBed() {
  console.log('\n=== Testing Update Bed (Assign Tenant) ===');
  const result = await apiCall('PATCH', `/beds/${bedId}`, {
    status: 'occupied',
    tenantId
  });
  
  if (result.success) {
    console.log('✅ Bed updated:', result.data);
  } else {
    console.log('❌ Update bed failed:', result.error);
  }
  return result.success;
}

async function testUpdateTicket() {
  console.log('\n=== Testing Update Ticket (Resolve) ===');
  const result = await apiCall('PATCH', `/tickets/${ticketId}`, {
    status: 'resolved'
  });
  
  if (result.success) {
    console.log('✅ Ticket updated:', result.data);
  } else {
    console.log('❌ Update ticket failed:', result.error);
  }
  return result.success;
}

async function testDeleteOperations() {
  console.log('\n=== Testing Delete Operations ===');
  
  // Delete tenant
  const deleteTenant = await apiCall('DELETE', `/tenants/${tenantId}`);
  console.log(deleteTenant.success ? '✅ Tenant deleted' : '❌ Delete tenant failed:', deleteTenant.error);
  
  // Delete bed
  const deleteBed = await apiCall('DELETE', `/beds/${bedId}`);
  console.log(deleteBed.success ? '✅ Bed deleted' : '❌ Delete bed failed:', deleteBed.error);
  
  // Delete room
  const deleteRoom = await apiCall('DELETE', `/rooms/${roomId}`);
  console.log(deleteRoom.success ? '✅ Room deleted' : '❌ Delete room failed:', deleteRoom.error);
  
  // Delete ticket
  const deleteTicket = await apiCall('DELETE', `/tickets/${ticketId}`);
  console.log(deleteTicket.success ? '✅ Ticket deleted' : '❌ Delete ticket failed:', deleteTicket.error);
  
  // Delete users
  if (ownerId) {
    const deleteOwner = await apiCall('DELETE', `/users/${ownerId}`);
    console.log(deleteOwner.success ? '✅ Owner deleted' : '❌ Delete owner failed:', deleteOwner.error);
  }
  
  if (managerId) {
    const deleteManager = await apiCall('DELETE', `/users/${managerId}`);
    console.log(deleteManager.success ? '✅ Manager deleted' : '❌ Delete manager failed:', deleteManager.error);
  }
  
  // Delete hostel
  const deleteHostel = await apiCall('DELETE', `/hostels/${hostelId}`);
  console.log(deleteHostel.success ? '✅ Hostel deleted' : '❌ Delete hostel failed:', deleteHostel.error);
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('Starting API Integration Tests');
  console.log('========================================');
  
  const tests = [
    testLogin,
    testGetMe,
    testCreateHostel,
    testGetHostels,
    testCreateRoom,
    testGetRooms,
    testCreateBed,
    testGetBeds,
    testCreateTenant,
    testGetTenants,
    testCreatePayment,
    testGetPayments,
    testMarkPaymentPaid,
    testCreateTicket,
    testGetTickets,
    testCreateManager,
    testGetUsers,
    testUpdateBed,
    testUpdateTicket,
    testDeleteOperations
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      else failed++;
    } catch (error) {
      console.log('❌ Test threw error:', error.message);
      failed++;
    }
  }
  
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('========================================');
}

runTests();
