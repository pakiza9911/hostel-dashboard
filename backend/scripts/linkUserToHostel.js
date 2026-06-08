import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function linkUserToHostel() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await connection.query(`USE ${process.env.DB_NAME || 'hostel_admin'}`);
    console.log('Connected to database\n');

    // Get the hostel
    const [hostels] = await connection.query('SELECT * FROM hostels LIMIT 1');
    if (hostels.length === 0) {
      console.log('No hostels found');
      return;
    }
    const hostel = hostels[0];
    console.log(`Found hostel: ${hostel.name} (ID: ${hostel.id})`);

    // Get the owner user
    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [hostel.owner_id]);
    if (users.length === 0) {
      console.log('Owner user not found');
      return;
    }
    const user = users[0];
    console.log(`Found owner: ${user.name} (${user.email})`);

    // Update user's hostel_id
    await connection.query('UPDATE users SET hostel_id = ? WHERE id = ?', [hostel.id, user.id]);
    console.log(`\nLinked user ${user.email} to hostel ${hostel.name}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

linkUserToHostel();
