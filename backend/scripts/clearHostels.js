import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function clearHostels() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await connection.query(`USE ${process.env.DB_NAME || 'hostel_admin'}`);
    console.log('Connected to database');

    // First, get all owner user IDs for the hostels being deleted
    const [owners] = await connection.query('SELECT DISTINCT owner_id FROM hostels');
    const ownerIds = owners.map(o => o.owner_id);
    
    // Delete all hostels (this will cascade delete rooms, beds, tenants, payments, tickets)
    const [result] = await connection.query('DELETE FROM hostels');
    console.log(`Deleted ${result.affectedRows} hostels`);
    
    // Delete the owner users (excluding super admin)
    if (ownerIds.length > 0) {
      const placeholders = ownerIds.map(() => '?').join(',');
      const [userResult] = await connection.query(
        `DELETE FROM users WHERE id IN (${placeholders}) AND role = 'owner'`,
        ownerIds
      );
      console.log(`Deleted ${userResult.affectedRows} owner users`);
    }

    console.log('All hostels and owner users deleted successfully!');
  } catch (error) {
    console.error('Error clearing hostels:', error);
  } finally {
    await connection.end();
  }
}

clearHostels();
