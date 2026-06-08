import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all users (scoped by hostel)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  let query = 'SELECT id, name, email, role, hostel_id, permissions, created_at FROM users';
  const params = [];

  if (req.user.role === 'owner') {
    query += ' WHERE hostel_id = $1';
    params.push(req.user.hostelId);
  } else if (req.user.role === 'manager') {
    query += ' WHERE id = $2';
    params.push(req.user.id);
  }

  const result = await pool.query(query, params);
  const parsedUsers = users.map((row) => {
    let permissions = [];
    try {
      permissions = u.permissions ? JSON.parse(u.permissions) : [];
    } catch (e) {
      permissions = [];
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      hostelId: u.hostel_id,
      permissions,
      createdAt: u.created_at
    };
  });
  res.json(parsedUsers);
}));

// Get single user
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, hostel_id, permissions, created_at FROM users WHERE id = $4',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const u = result.rows[0];
  let permissions = [];
  try {
    permissions = u.permissions ? JSON.parse(u.permissions) : [];
  } catch (e) {
    permissions = [];
  }
  res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    hostelId: u.hostel_id,
    permissions,
    createdAt: u.created_at
  });
}));

// Create user (super admin or owner)
router.post('/', authenticateToken, requireRole('super_admin', 'owner'), asyncHandler(async (req, res) => {
  const { name, email, password, role, hostelId, permissions } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role required' });
  }

  // Owners can only create staff/managers for their hostel
  if (req.user.role === 'owner') {
    if (role !== 'manager' && role !== 'staff') {
      return res.status(403).json({ error: 'Owners can only create staff or managers' });
    }
    // For owners, use their hostelId if not provided
    const finalHostelId = hostelId || req.user.hostelId;
    if (finalHostelId !== req.user.hostelId) {
      return res.status(403).json({ error: 'Can only create users for your hostel' });
    }
  }

  const bcrypt = (await import('bcryptjs')).default;
  const passwordHash = await bcrypt.hash(password, 10);
  const id = `u_${Date.now()}`;
  const finalHostelId = req.user.role === 'owner' ? (hostelId || req.user.hostelId)  : hostelId;

  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role, hostel_id, permissions) VALUES ($7, $8, $9, $10, $11, $12, $13)',
    [id, name, email, passwordHash, role, finalHostelId || null, permissions ? JSON.stringify(permissions) : null]
  );

  res.status(201).json({ id, name, email, role, hostelId: finalHostelId, message: 'User created successfully' });
}));

// Update user
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { name, email, role, hostelId, permissions } = req.body;

  // Check permissions
  const result = await pool.query('SELECT * FROM users WHERE id = $15', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const targetUser = result.rows[0];

  // Super admin can update anyone
  // Owners can update managers in their hostel
  // Managers can only update themselves
  if (req.user.role === 'manager' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  if (req.user.role === 'owner') {
    // Owners can update their own profile
    if (req.user.id === req.params.id) {
      // Allow self-update (but not role/hostel changes)
      if (role !== undefined && role !== targetUser.role) {
        return res.status(403).json({ error: 'Cannot change your own role' });
      }
      if (hostelId !== undefined && hostelId !== targetUser.hostel_id) {
        return res.status(403).json({ error: 'Cannot change your own hostel' });
      }
    } else {
      // Owners can update staff/managers in their hostel
      if (targetUser.hostel_id !== req.user.hostelId) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      if (targetUser.role === 'super_admin' || targetUser.role === 'owner') {
        return res.status(403).json({ error: 'Cannot modify super admins or other owners' });
      }
    }
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = $16');
    values.push(name);
  }
  if (email !== undefined) {
    updates.push('email = $17');
    values.push(email);
  }
  if (role !== undefined) {
    updates.push('role = $18');
    values.push(role);
  }
  if (hostelId !== undefined) {
    updates.push('hostel_id = $19');
    values.push(hostelId);
  }
  if (permissions !== undefined) {
    updates.push('permissions = $20');
    values.push(permissions ? JSON.stringify(permissions) : null);
  }

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);
  await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $22`,
    values
  );

  res.json({ message: 'User updated successfully' });
}));

// Delete user
router.delete('/:id', authenticateToken, requireRole('super_admin', 'owner'), asyncHandler(async (req, res) => {
  // Check permissions
  const result = await pool.query('SELECT * FROM users WHERE id = $23', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const targetUser = result.rows[0];

  // Owners can only delete managers in their hostel
  if (req.user.role === 'owner') {
    if (targetUser.hostel_id !== req.user.hostelId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (targetUser.role === 'super_admin' || targetUser.role === 'owner') {
      return res.status(403).json({ error: 'Cannot delete super admins or other owners' });
    }
  }

  // Super admin cannot delete themselves
  if (req.user.role === 'super_admin' && req.user.id === req.params.id) {
    return res.status(403).json({ error: 'Cannot delete yourself' });
  }

  await pool.query('DELETE FROM users WHERE id = $24', [req.params.id]);
  res.json({ message: 'User deleted successfully' });
}));

export default router;
