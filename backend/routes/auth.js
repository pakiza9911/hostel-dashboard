import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { jwtSecret, jwtExpiresIn } from '../config/auth.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const [users] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = users[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, hostelId: user.hostel_id },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hostelId: user.hostel_id,
      permissions: user.permissions,
      createdAt: user.created_at
    }
  });
}));

// Register (super admin only)
router.post('/register', authenticateToken, requireRole('super_admin'), asyncHandler(async (req, res) => {
  const { name, email, password, role, hostelId, permissions } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role required' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = `u_${Date.now()}`;

  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role, hostel_id, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, email, passwordHash, role, hostelId || null, permissions ? JSON.stringify(permissions) : null]
  );

  res.status(201).json({ message: 'User created successfully' });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    'SELECT id, name, email, role, hostel_id, permissions, created_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[0];
  let permissions = [];
  try {
    permissions = user.permissions ? JSON.parse(user.permissions) : [];
  } catch (e) {
    permissions = [];
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hostelId: user.hostel_id,
    permissions,
    createdAt: user.created_at
  });
}));

// Switch role (for testing)
router.post('/switch-role', asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!role || !['super_admin', 'owner', 'manager'].includes(role)) {
    return res.status(400).json({ error: 'Valid role required' });
  }

  const [users] = await pool.query(
    'SELECT * FROM users WHERE role = ? LIMIT 1',
    [role]
  );

  if (users.length === 0) {
    return res.status(404).json({ error: 'No user found with this role' });
  }

  const user = users[0];
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, hostelId: user.hostel_id },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hostelId: user.hostel_id,
      permissions: user.permissions,
      createdAt: user.created_at
    }
  });
}));

export default router;
