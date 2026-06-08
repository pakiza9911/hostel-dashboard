import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all hostels (scoped by role)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  let query = 'SELECT * FROM hostels';
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' WHERE id = ?';
    params.push(req.user.hostelId);
  }

  const [hostels] = await pool.query(query, params);
  const parsedHostels = hostels.map((h) => {
    let facilities = [];
    try {
      facilities = h.facilities ? JSON.parse(h.facilities) : [];
    } catch (e) {
      facilities = [];
    }
    return {
      id: h.id,
      name: h.name,
      ownerId: h.owner_id,
      address: h.address,
      city: h.city,
      phone: h.phone,
      email: h.email,
      totalRooms: h.total_rooms,
      totalBeds: h.total_beds,
      occupiedBeds: h.occupied_beds,
      monthlyRevenue: parseFloat(h.monthly_revenue || 0),
      status: h.status,
      facilities,
      createdAt: h.created_at
    };
  });
  res.json(parsedHostels);
}));

// Get single hostel
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'SELECT * FROM hostels WHERE id = ?',
    [req.params.id]
  );

  if (result.length === 0) {
    return res.status(404).json({ error: 'Hostel not found' });
  }

  const h = result[0];
  let facilities = [];
  try {
    facilities = h.facilities ? JSON.parse(h.facilities) : [];
  } catch (e) {
    facilities = [];
  }

  res.json({
    id: h.id,
    name: h.name,
    ownerId: h.owner_id,
    address: h.address,
    city: h.city,
    phone: h.phone,
    email: h.email,
    totalRooms: h.total_rooms,
    totalBeds: h.total_beds,
    occupiedBeds: h.occupied_beds,
    monthlyRevenue: parseFloat(h.monthly_revenue || 0),
    status: h.status,
    facilities,
    createdAt: h.created_at
  });
}));

// Create hostel (super admin only)
router.post('/', authenticateToken, requireRole('super_admin'), asyncHandler(async (req, res) => {
  const { name, ownerId, address, city, phone, email, facilities } = req.body;

  if (!name || !ownerId) {
    return res.status(400).json({ error: 'Name and owner ID required' });
  }

  const id = `h_${Date.now()}`;
  await pool.query(
    'INSERT INTO hostels (id, name, owner_id, address, city, phone, email, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, ownerId, address || null, city || null, phone || null, email || null, facilities ? JSON.stringify(facilities) : JSON.stringify([])]
  );

  res.status(201).json({ id, message: 'Hostel created successfully' });
}));

// Update hostel
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { name, address, city, phone, email, facilities, status } = req.body;
  
  // Check permissions
  if (req.user.role !== 'super_admin') {
    const [result] = await pool.query('SELECT * FROM hostels WHERE id = ?', [req.params.id]);
    if (result.length === 0 || result[0].id !== req.user.hostelId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  }

  await pool.query(
    'UPDATE hostels SET name = ?, address = ?, city = ?, phone = ?, email = ?, facilities = ?, status = ? WHERE id = ?',
    [name, address, city, phone, email, facilities ? JSON.stringify(facilities)  : null, status, req.params.id]
  );

  res.json({ message: 'Hostel updated successfully' });
}));

// Delete hostel (super admin only)
router.delete('/:id', authenticateToken, requireRole('super_admin'), asyncHandler(async (req, res) => {
  // Get the hostel's owner_id before deleting
  const [result] = await pool.query('SELECT owner_id FROM hostels WHERE id = ?', [req.params.id]);
  
  if (result.length === 0) {
    return res.status(404).json({ error: 'Hostel not found' });
  }

  const ownerId = result[0].owner_id;

  // Delete the hostel (this will cascade delete rooms, beds, tenants, payments, tickets)
  await pool.query('DELETE FROM hostels WHERE id = ?', [req.params.id]);

  // Delete the owner user (if they're an owner role, not super admin)
  await pool.query('DELETE FROM users WHERE id = ? AND role = ?', [ownerId, 'owner']);

  res.json({ message : 'Hostel and owner deleted successfully' });
}));

export default router;
