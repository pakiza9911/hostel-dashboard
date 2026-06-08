import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addStaffRole() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await connection.query(`USE ${process.env.DB_NAME || 'hostel_admin'}`);
    console.log('Connected to database');

    // Modify the role ENUM to include 'staff'
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('super_admin', 'owner', 'manager', 'staff') NOT NULL
    `);
    console.log('✓ Added staff role to users table');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addStaffRole();
