import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await connection.query(`USE ${process.env.DB_NAME || 'hostel_admin'}`);
    console.log('Connected to database\n');

    // Check hostels
    const [hostels] = await connection.query('SELECT * FROM hostels');
    console.log(`Hostels (${hostels.length}):`);
    hostels.forEach(h => console.log(`- ${h.name} (ID: ${h.id}, Owner: ${h.owner_id})`));

    // Check users
    const [users] = await connection.query('SELECT id, name, email, role, hostel_id FROM users');
    console.log(`\nUsers (${users.length}):`);
    users.forEach(u => console.log(`- ${u.name} (${u.email}) - ${u.role} - Hostel ID: ${u.hostel_id}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkDatabase();
