import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'https://hostel-dashboard-production.up.railway.app/api';

let authToken = '';
let hostelId = '';
let userId = '';
let roomId = '';
let bedId = '';
let tenantId = '';
let paymentId = '';
let ticketId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function testLogin(email, password, role) {
  logSection(`1. Testing Login API (${role})`);
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    authToken = response.data.token;
    userId = response.data.user.id;
    hostelId = response.data.user.hostelId;
    logSuccess(`Login successful! Token: ${authToken.substring(0, 20)}...`);
    logInfo(`User ID: ${userId}, Hostel ID: ${hostelId}`);
    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testHostelsAPI() {
  logSection('2. Testing Hostels API');
  
  // GET all hostels
  try {
    const response = await axios.get(`${API_URL}/hostels`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /hostels - Found ${response.data.length} hostels`);
    if (response.data.length > 0) {
      hostelId = response.data[0].id;
      logInfo(`Using hostel ID: ${hostelId}`);
    }
  } catch (error) {
    logError(`GET /hostels failed: ${error.response?.data?.error || error.message}`);
  }

  // GET single hostel
  if (hostelId) {
    try {
      const response = await axios.get(`${API_URL}/hostels/${hostelId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`GET /hostels/${hostelId} - Found hostel: ${response.data.name}`);
    } catch (error) {
      logError(`GET /hostels/${hostelId} failed: ${error.response?.data?.error || error.message}`);
      if (error.response?.data?.error) {
        logInfo(`Error details: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

async function testRoomsAPI() {
  logSection('3. Testing Rooms API');
  
  // GET all rooms
  try {
    const response = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /rooms - Found ${response.data.length} rooms`);
  } catch (error) {
    logError(`GET /rooms failed: ${error.response?.data?.error || error.message}`);
  }

  // POST new room
  if (hostelId) {
    try {
      const timestamp = Date.now();
      const newRoom = {
        hostelId,
        number: '101',
        floor: 1,
        type: 'double',
        capacity: 2,
        rentPerBed: 6000,
        facilities: ['WiFi', 'Fan'],
        status: 'active'
      };
      const response = await axios.post(`${API_URL}/rooms`, newRoom, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      roomId = response.data.id;
      logSuccess(`POST /rooms - Created room ${newRoom.number} with ID: ${roomId}`);
    } catch (error) {
      logError(`POST /rooms failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // PUT update room
  if (roomId) {
    try {
      await axios.put(`${API_URL}/rooms/${roomId}`, { status: 'maintenance' }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`PUT /rooms/${roomId} - Updated room status to maintenance`);
    } catch (error) {
      logError(`PUT /rooms/${roomId} failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // DELETE room
  if (roomId) {
    try {
      await axios.delete(`${API_URL}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`DELETE /rooms/${roomId} - Deleted room`);
    } catch (error) {
      logError(`DELETE /rooms/${roomId} failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

async function testBedsAPI() {
  logSection('4. Testing Beds API');
  
  // First create a room for beds
  if (hostelId) {
    try {
      const roomNum = Math.floor(Math.random() * 900) + 100; // Random room number 100-999
      const newRoom = {
        hostelId,
        number: roomNum.toString(),
        floor: 1,
        type: 'double',
        capacity: 2,
        rentPerBed: 6000,
        facilities: ['WiFi', 'Fan'],
        status: 'active'
      };
      const roomResponse = await axios.post(`${API_URL}/rooms`, newRoom, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      roomId = roomResponse.data.id;
      logInfo(`Created room ${newRoom.number} for bed testing: ${roomId}`);
    } catch (error) {
      logError(`Failed to create room for bed testing: ${error.response?.data?.error || error.message}`);
      return;
    }
  }

  // GET all beds
  try {
    const response = await axios.get(`${API_URL}/beds`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /beds - Found ${response.data.length} beds`);
  } catch (error) {
    logError(`GET /beds failed: ${error.response?.data?.error || error.message}`);
  }

  // POST new bed
  if (roomId && hostelId) {
    try {
      const newBed = {
        roomId,
        hostelId,
        label: 'A',
        status: 'vacant'
      };
      const response = await axios.post(`${API_URL}/beds`, newBed, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      bedId = response.data.id;
      logSuccess(`POST /beds - Created bed ${newBed.label} with ID: ${bedId}`);
    } catch (error) {
      logError(`POST /beds failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // PUT update bed
  if (bedId) {
    try {
      await axios.put(`${API_URL}/beds/${bedId}`, { status: 'maintenance' }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`PUT /beds/${bedId} - Updated bed status to maintenance`);
    } catch (error) {
      logError(`PUT /beds/${bedId} failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

async function testTenantsAPI() {
  logSection('5. Testing Tenants API');
  
  // GET all tenants
  try {
    const response = await axios.get(`${API_URL}/tenants`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /tenants - Found ${response.data.length} tenants`);
  } catch (error) {
    logError(`GET /tenants failed: ${error.response?.data?.error || error.message}`);
  }

  // POST new tenant
  if (hostelId) {
    try {
      const newTenant = {
        id: `t_${Date.now()}`,
        hostelId,
        name: 'Test Tenant',
        email: `tenant${Date.now()}@test.com`,
        phone: '1234567890',
        gender: 'male',
        idType: 'cnic',
        idNumber: '12345-6789012-3',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '0987654321',
        address: 'Test Address',
        joinDate: new Date().toISOString().slice(0, 10),
        monthlyRent: 6000,
        securityDeposit: 12000,
        status: 'pending'
      };
      const response = await axios.post(`${API_URL}/tenants`, newTenant, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      tenantId = response.data.id;
      logSuccess(`POST /tenants - Created tenant ${newTenant.name} with ID: ${tenantId}`);
    } catch (error) {
      logError(`POST /tenants failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // PUT update tenant
  if (tenantId) {
    try {
      await axios.put(`${API_URL}/tenants/${tenantId}`, { status: 'active' }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`PUT /tenants/${tenantId} - Updated tenant status to active`);
    } catch (error) {
      logError(`PUT /tenants/${tenantId} failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // DELETE tenant
  if (tenantId) {
    try {
      await axios.delete(`${API_URL}/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`DELETE /tenants/${tenantId} - Deleted tenant`);
    } catch (error) {
      logError(`DELETE /tenants/${tenantId} failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

async function testPaymentsAPI() {
  logSection('6. Testing Payments API');
  
  // First create a tenant for payment
  if (hostelId) {
    try {
      const newTenant = {
        id: `t_${Date.now()}`,
        hostelId,
        name: 'Payment Test Tenant',
        email: `payment${Date.now()}@test.com`,
        phone: '1234567890',
        gender: 'male',
        idType: 'cnic',
        idNumber: '12345-6789012-3',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '0987654321',
        address: 'Test Address',
        joinDate: new Date().toISOString().slice(0, 10),
        monthlyRent: 6000,
        securityDeposit: 12000,
        status: 'active'
      };
      const response = await axios.post(`${API_URL}/tenants`, newTenant, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      tenantId = response.data.id;
      logInfo(`Created tenant for payment testing: ${tenantId}`);
    } catch (error) {
      logError(`Failed to create tenant for payment testing: ${error.response?.data?.error || error.message}`);
    }
  }

  // GET all payments
  try {
    const response = await axios.get(`${API_URL}/payments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /payments - Found ${response.data.length} payments`);
  } catch (error) {
    logError(`GET /payments failed: ${error.response?.data?.error || error.message}`);
  }

  // POST new payment
  if (hostelId && tenantId) {
    try {
      const newPayment = {
        id: `p_${Date.now()}`,
        hostelId,
        tenantId,
        amount: 6000,
        type: 'rent',
        method: 'cash',
        dueDate: new Date().toISOString().slice(0, 10),
        monthFor: new Date().toISOString().slice(0, 7),
        invoiceNumber: `INV-${Date.now()}`,
        status: 'pending'
      };
      const response = await axios.post(`${API_URL}/payments`, newPayment, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      paymentId = response.data.id;
      logSuccess(`POST /payments - Created payment with ID: ${paymentId}`);
    } catch (error) {
      logError(`POST /payments failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // PUT update payment
  if (paymentId) {
    try {
      await axios.put(`${API_URL}/payments/${paymentId}`, { status: 'paid', paidDate: new Date().toISOString().slice(0, 10) }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`PUT /payments/${paymentId} - Updated payment status to paid`);
    } catch (error) {
      logError(`PUT /payments/${paymentId} failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

async function testMaintenanceAPI() {
  logSection('7. Testing Maintenance Tickets API');
  
  // GET all tickets
  try {
    const response = await axios.get(`${API_URL}/tickets`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /tickets - Found ${response.data.length} tickets`);
  } catch (error) {
    logError(`GET /tickets failed: ${error.response?.data?.error || error.message}`);
  }

  // POST new ticket (without roomId to avoid foreign key error)
  if (hostelId) {
    try {
      const newTicket = {
        hostelId,
        title: 'Test Maintenance Request',
        description: 'This is a test maintenance request',
        category: 'plumbing',
        priority: 'medium'
      };
      const response = await axios.post(`${API_URL}/tickets`, newTicket, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      ticketId = response.data.id;
      logSuccess(`POST /tickets - Created ticket with ID: ${ticketId}`);
    } catch (error) {
      logError(`POST /tickets failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // PUT update ticket
  if (ticketId) {
    try {
      await axios.put(`${API_URL}/tickets/${ticketId}`, { status: 'in_progress' }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`PUT /tickets/${ticketId} - Updated ticket status to in_progress`);
    } catch (error) {
      logError(`PUT /tickets/${ticketId} failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

async function testUsersAPI() {
  logSection('8. Testing Users API');
  
  // GET all users
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /users - Found ${response.data.length} users`);
  } catch (error) {
    logError(`GET /users failed: ${error.response?.data?.error || error.message}`);
  }

  // POST new user (staff)
  if (hostelId) {
    try {
      const newUser = {
        name: 'Test Staff',
        email: `staff${Date.now()}@test.com`,
        password: 'staff123',
        role: 'staff',
        hostelId,
        permissions: ['view_dashboard', 'manage_rooms']
      };
      const response = await axios.post(`${API_URL}/users`, newUser, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const newUserId = response.data.id;
      logSuccess(`POST /users - Created staff user with ID: ${newUserId}`);
      
      // DELETE the created user
      await axios.delete(`${API_URL}/users/${newUserId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`DELETE /users/${newUserId} - Deleted staff user`);
    } catch (error) {
      logError(`POST /users failed: ${error.response?.data?.error || error.message}`);
      if (error.response?.data) {
        logInfo(`Error details: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  // PUT update current user (self-update)
  if (userId) {
    try {
      await axios.put(`${API_URL}/users/${userId}`, { name: 'Wajid Updated' }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`PUT /users/${userId} - Updated user name (self-update)`);
      
      // Revert the change
      await axios.put(`${API_URL}/users/${userId}`, { name: 'Wajid' }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`PUT /users/${userId} - Reverted user name`);
    } catch (error) {
      logError(`PUT /users/${userId} failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

async function runAllTests(email, password, role) {
  logSection(`Starting API Tests for ${role} Role`);
  logInfo(`Testing with ${role}: ${email}`);
  
  const loginSuccess = await testLogin(email, password, role);
  if (!loginSuccess) {
    logError('Cannot proceed without authentication. Exiting.');
    return;
  }

  await testHostelsAPI();
  await testRoomsAPI();
  await testBedsAPI();
  await testTenantsAPI();
  await testPaymentsAPI();
  await testMaintenanceAPI();
  await testUsersAPI();

  logSection('API Tests Complete');
  logSuccess('All tests finished!');
}

async function runAllTestsForBothRoles() {
  // Test Super Admin
  await runAllTests('admin@hostelhub.pk', 'admin123', 'super_admin');
  
  // Reset variables
  authToken = '';
  userId = '';
  hostelId = '';
  roomId = '';
  bedId = '';
  tenantId = '';
  paymentId = '';
  ticketId = '';
  
  // Test Owner
  await runAllTests('abdulwajid9997@gmail.com', 'wajid123', 'owner');
}

runAllTestsForBothRoles().catch(console.error);
