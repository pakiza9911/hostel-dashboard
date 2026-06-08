import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'hostel_admin'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'hostel_admin'}`);

    console.log('Database created/selected');

    // Create tables in correct order (hostels first, then users)
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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'owner', 'manager') NOT NULL,
        hostel_id VARCHAR(50),
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL
      )
    `);

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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS beds (
        id VARCHAR(50) PRIMARY KEY,
        room_id VARCHAR(50) NOT NULL,
        hostel_id VARCHAR(50) NOT NULL,
        label VARCHAR(10) NOT NULL,
        tenant_id VARCHAR(50),
        status ENUM('vacant', 'occupied', 'reserved', 'maintenance') DEFAULT 'vacant',
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(50) PRIMARY KEY,
        hostel_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        gender ENUM('male', 'female', 'other') NOT NULL,
        id_type ENUM('cnic', 'passport', 'driving_license', 'other') NOT NULL,
        id_number VARCHAR(100),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        address TEXT,
        bed_id VARCHAR(50),
        room_id VARCHAR(50),
        join_date DATE NOT NULL,
        checkout_date DATE,
        monthly_rent DECIMAL(10,2) NOT NULL,
        security_deposit DECIMAL(10,2) NOT NULL,
        status ENUM('active', 'checked_out', 'pending') DEFAULT 'pending',
        occupation VARCHAR(100),
        notes TEXT,
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
        FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        hostel_id VARCHAR(50) NOT NULL,
        tenant_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('rent', 'deposit', 'fine', 'other') NOT NULL,
        method ENUM('cash', 'card', 'upi', 'bank_transfer') NOT NULL,
        status ENUM('paid', 'pending', 'overdue', 'partial') DEFAULT 'pending',
        due_date DATE NOT NULL,
        paid_date DATE,
        month_for VARCHAR(7) NOT NULL,
        invoice_number VARCHAR(50) NOT NULL,
        notes TEXT,
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS maintenance_tickets (
        id VARCHAR(50) PRIMARY KEY,
        hostel_id VARCHAR(50) NOT NULL,
        room_id VARCHAR(50),
        tenant_id VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('plumbing', 'electrical', 'furniture', 'cleaning', 'wifi', 'other') NOT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
        assigned_to VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('Tables created successfully');

    // Create default super admin
    const adminId = 'u_admin';
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT IGNORE INTO users (id, name, email, password_hash, role, hostel_id, permissions)
      VALUES (?, ?, ?, ?, ?, NULL, NULL)
    `, [adminId, 'Abdul Wajid', 'admin@hostelhub.pk', passwordHash, 'super_admin']);

    console.log('Default super admin created (email: admin@hostelhub.pk, password: admin123)');

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await connection.end();
  }
}

initDatabase();
