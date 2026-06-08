import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function testRoomCreation() {
  console.log('Testing Room Creation Only');
  
  // Login
  const login = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@hostelhub.pk',
    password: 'admin123'
  });
  
  const token = login.data.token;
  console.log('Token:', token.substring(0, 50));
  
  // Create owner
  const owner = await axios.post(`${API_URL}/users`, {
    name: 'Test Owner',
    email: `owner${Date.now()}@test.com`,
    password: 'owner123',
    role: 'owner',
    permissions: ['view_dashboard']
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const ownerId = owner.data.id;
  console.log('Owner ID:', ownerId);
  
  // Create hostel
  const hostel = await axios.post(`${API_URL}/hostels`, {
    name: 'Test Hostel',
    city: 'Lahore',
    address: '123 Test St',
    ownerId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const hostelId = hostel.data.id;
  console.log('Hostel ID:', hostelId);
  
  // Re-login to get fresh token
  const login2 = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@hostelhub.pk',
    password: 'admin123'
  });
  const token2 = login2.data.token;
  console.log('New Token:', token2.substring(0, 50));
  
  // Create room
  try {
    const room = await axios.post(`${API_URL}/rooms`, {
      hostelId,
      number: '101',
      floor: 1,
      capacity: 4,
      type: 'dorm',
      rentPerBed: 5000
    }, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.log('✅ Room created:', room.data);
  } catch (error) {
    console.log('❌ Room failed:', error.response?.data);
  }
}

testRoomCreation();
