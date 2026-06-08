import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function deleteUserByEmail() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await connection.query(`USE ${process.env.DB_NAME || 'hostel_admin'}`);
    console.log('Connected to database');

    // List all users (excluding super admin)
    const [users] = await connection.query(
      "SELECT id, name, email, role FROM users WHERE role != 'super_admin'"
    );
    console.log('Current users (excluding super admin):');
    users.forEach(u => console.log(`- ${u.name} (${u.email}) - ${u.role} - ID: ${u.id}`));

    // Delete all non-super-admin users
    const [result] = await connection.query("DELETE FROM users WHERE role != 'super_admin'");
    console.log(`\nDeleted ${result.affectedRows} users`);

    console.log('All non-super-admin users deleted successfully!');
  } catch (error) {
    console.error('Error deleting users:', error);
  } finally {
    await connection.end();
  }
}

deleteUserByEmail();
