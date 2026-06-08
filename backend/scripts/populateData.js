import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

let authToken = '';
let hostelId = '';
let roomId = '';
let bedId = '';
let tenantId = '';
let paymentId = '';
let ticketId = '';

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

async function populateData() {
  console.log('========================================');
  console.log('Populating Database with Test Data');
  console.log('========================================');
  
  const timestamp = Date.now();
  
  // Step 1: Login
  console.log('\n1. Logging in as super admin...');
  const login = await apiCall('POST', '/auth/login', {
    email: 'admin@hostelhub.pk',
    password: 'admin123'
  });
  if (!login.success) {
    console.log('❌ Login failed:', login.error);
    return;
  }
  authToken = login.data.token;
  console.log('✅ Login successful');
  
  // Step 2: Create owner user
  console.log('\n2. Creating owner user...');
  const owner = await apiCall('POST', '/users', {
    name: 'Ali Khan',
    email: `ali${timestamp}@hostel.com`,
    password: 'owner123',
    role: 'owner',
    permissions: ['view_dashboard', 'manage_rooms', 'manage_tenants', 'manage_payments', 'manage_maintenance']
  });
  if (!owner.success) {
    console.log('❌ Create owner failed:', owner.error);
    return;
  }
  const ownerId = owner.data.id;
  console.log('✅ Owner created:', ownerId);
  
  // Step 3: Create hostel
  console.log('\n3. Creating hostel...');
  const hostel = await apiCall('POST', '/hostels', {
    name: 'Green Valley Hostel',
    city: 'Lahore',
    address: '123 Main Boulevard, Gulberg III',
    phone: '+92-300-1234567',
    email: 'greenvalley@hostel.com',
    totalRooms: 10,
    totalBeds: 40,
    facilities: ['wifi', 'ac', 'food', 'laundry', 'security'],
    ownerId
  });
  if (!hostel.success) {
    console.log('❌ Create hostel failed:', hostel.error);
    return;
  }
  hostelId = hostel.data.id;
  console.log('✅ Hostel created:', hostelId);
  
  // Step 4: Create room
  console.log('\n4. Creating room...');
  const room = await apiCall('POST', '/rooms', {
    hostelId,
    number: '101',
    floor: 1,
    capacity: 4,
    type: 'dorm',
    rentPerBed: 5000,
    facilities: ['ac', 'wifi']
  });
  if (!room.success) {
    console.log('❌ Create room failed:', room.error);
    return;
  }
  roomId = room.data.id;
  console.log('✅ Room created:', roomId);
  
  // Step 5: Create beds
  console.log('\n5. Creating beds...');
  for (let i = 1; i <= 4; i++) {
    const bed = await apiCall('POST', '/beds', {
      roomId,
      hostelId,
      label: `A${i}`,
      price: 5000
    });
    if (bed.success) {
      if (i === 1) bedId = bed.data.id;
      console.log(`✅ Bed A${i} created`);
    } else {
      console.log(`❌ Create bed A${i} failed:`, bed.error);
    }
  }
  
  // Step 6: Create tenant
  console.log('\n6. Creating tenant...');
  const tenant = await apiCall('POST', '/tenants', {
    hostelId,
    name: 'Ahmed Raza',
    email: 'ahmed@example.com',
    phone: '+92-300-7654321',
    gender: 'male',
    idType: 'cnic',
    idNumber: '12345-6789012-3',
    monthlyRent: 5000,
    securityDeposit: 10000
  });
  if (!tenant.success) {
    console.log('❌ Create tenant failed:', tenant.error);
    return;
  }
  tenantId = tenant.data.id;
  console.log('✅ Tenant created:', tenantId);
  
  // Step 7: Update bed to assign tenant (skipping due to foreign key constraint issue)
  console.log('\n7. Assigning tenant to bed...');
  console.log('Skipping bed assignment (foreign key constraint needs fixing)');
  // TODO: Fix database schema - beds.tenant_id should reference tenants(id) not users(id)
  
  // Step 8: Create payment
  console.log('\n8. Creating payment...');
  const payment = await apiCall('POST', '/payments', {
    tenantId,
    hostelId,
    amount: 5000,
    type: 'rent',
    method: 'cash',
    monthFor: new Date().toISOString().slice(0, 7),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoiceNumber: `INV-${Date.now()}`,
    status: 'pending'
  });
  if (!payment.success) {
    console.log('❌ Create payment failed:', payment.error);
    return;
  }
  paymentId = payment.data.id;
  console.log('✅ Payment created:', paymentId);
  
  // Step 9: Create maintenance ticket
  console.log('\n9. Creating maintenance ticket...');
  const ticket = await apiCall('POST', '/tickets', {
    title: 'AC not cooling properly',
    description: 'Air conditioner in room 101 is not cooling effectively',
    category: 'electrical',
    priority: 'high',
    hostelId,
    roomId
  });
  if (!ticket.success) {
    console.log('❌ Create ticket failed:', ticket.error);
    return;
  }
  ticketId = ticket.data.id;
  console.log('✅ Ticket created:', ticketId);
  
  // Step 10: Create manager user
  console.log('\n10. Creating manager user...');
  const manager = await apiCall('POST', '/users', {
    name: 'Sara Ahmed',
    email: `sara${timestamp}@hostel.com`,
    password: 'manager123',
    role: 'manager',
    hostelId,
    permissions: ['view_dashboard', 'manage_rooms', 'manage_tenants', 'manage_payments', 'manage_maintenance']
  });
  console.log(manager.success ? '✅ Manager created' : '❌ Create manager failed:', manager.error);
  
  // Step 11: Verify data
  console.log('\n========================================');
  console.log('Verifying Created Data');
  console.log('========================================');
  
  const hostels = await apiCall('GET', '/hostels');
  console.log(`\nHostels: ${hostels.success ? hostels.data.length : 'Error'}`);
  
  const rooms = await apiCall('GET', '/rooms');
  console.log(`Rooms: ${rooms.success ? rooms.data.length : 'Error'}`);
  
  const beds = await apiCall('GET', '/beds');
  console.log(`Beds: ${beds.success ? beds.data.length : 'Error'}`);
  
  const tenants = await apiCall('GET', '/tenants');
  console.log(`Tenants: ${tenants.success ? tenants.data.length : 'Error'}`);
  
  const payments = await apiCall('GET', '/payments');
  console.log(`Payments: ${payments.success ? payments.data.length : 'Error'}`);
  
  const tickets = await apiCall('GET', '/tickets');
  console.log(`Tickets: ${tickets.success ? tickets.data.length : 'Error'}`);
  
  const users = await apiCall('GET', '/users');
  console.log(`Users: ${users.success ? users.data.length : 'Error'}`);
  
  console.log('\n========================================');
  console.log('Data Population Complete!');
  console.log('========================================');
  console.log('\nYou can now log in to the frontend at http://localhost:5173');
  console.log('Super Admin: admin@hostelhub.pk / admin123');
  console.log('Owner: ali@hostel.com / owner123');
  console.log('Manager: sara@hostel.com / manager123');
}

populateData();
