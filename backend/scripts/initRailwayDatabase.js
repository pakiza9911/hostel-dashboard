import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function initRailwayDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Connected to Railway MySQL database');

    // Create tables in correct order
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hostels (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id VARCHAR(50) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255),
        total_rooms INT DEFAULT 0,
        total_beds INT DEFAULT 0,
        occupied_beds INT DEFAULT 0,
        monthly_revenue DECIMAL(12,2) DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        facilities JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created hostels table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'owner', 'manager', 'staff') NOT NULL,
        hostel_id VARCHAR(50),
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Created users table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(50) PRIMARY KEY,
        hostel_id VARCHAR(50) NOT NULL,
        number VARCHAR(20) NOT NULL,
        floor INT NOT NULL,
        type ENUM('single', 'double', 'triple', 'quad', 'dorm') NOT NULL,
        capacity INT NOT NULL,
        rent_per_bed DECIMAL(10,2) NOT NULL,
        facilities JSON,
        status ENUM('active', 'maintenance') DEFAULT 'active',
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created rooms table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS beds (
        id VARCHAR(50) PRIMARY KEY,
        room_id VARCHAR(50) NOT NULL,
        bed_number VARCHAR(10) NOT NULL,
        status ENUM('vacant', 'occupied', 'maintenance') DEFAULT 'vacant',
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created beds table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(50) PRIMARY KEY,
        hostel_id VARCHAR(50) NOT NULL,
        room_id VARCHAR(50),
        bed_id VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        cnic VARCHAR(20),
        check_in_date DATE,
        check_out_date DATE,
        status ENUM('active', 'checked_out') DEFAULT 'active',
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
        FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Created tenants table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        hostel_id VARCHAR(50) NOT NULL,
        tenant_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        due_date DATE,
        paid_date DATE,
        status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
        type ENUM('rent', 'deposit', 'other') DEFAULT 'rent',
        method ENUM('cash', 'bank_transfer', 'jazzcash', 'easypaisa') DEFAULT 'cash',
        month_for VARCHAR(20),
        invoice_number VARCHAR(50),
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created payments table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(50) PRIMARY KEY,
        hostel_id VARCHAR(50) NOT NULL,
        room_id VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('plumbing', 'electrical', 'furniture', 'cleaning', 'other') DEFAULT 'other',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Created tickets table');

    // Create super admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT IGNORE INTO users (id, name, email, password_hash, role, hostel_id)
      VALUES ('u_admin', 'Super Admin', 'admin@hostelhub.pk', ?, 'super_admin', NULL)
    `, [adminPassword]);
    console.log('✓ Created super admin user (admin@hostelhub.pk / admin123)');

    console.log('\n✅ Database initialized successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

initRailwayDatabase();
