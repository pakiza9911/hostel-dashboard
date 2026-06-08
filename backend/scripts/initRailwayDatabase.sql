-- Create tables in correct order
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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS beds (
  id VARCHAR(50) PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  bed_number VARCHAR(10) NOT NULL,
  status ENUM('vacant', 'occupied', 'maintenance') DEFAULT 'vacant',
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

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
);

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
);

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
);

-- Create super admin user (password: admin123)
INSERT IGNORE INTO users (id, name, email, password_hash, role, hostel_id)
VALUES ('u_admin', 'Super Admin', 'admin@hostelhub.pk', '$2a$10$VIUwbbV6Dwo54RaN/sXGVuav2BYBwV.aVYSjZmP06n2wHSCc9P/wW', 'super_admin', NULL);
