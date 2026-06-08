import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all rooms (scoped by hostel)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  let query = 'SELECT * FROM rooms';
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' WHERE hostel_id = ?';
    params.push(req.user.hostelId);
    
  }

  const [rooms] = await pool.query(query, params);
  const parsedRooms = rooms.map((r) => {
    let facilities = [];
    try {
      facilities = r.facilities ? JSON.parse(r.facilities) : [];
    } catch (e) {
      facilities = [];
    }
    return {
      id: r.id,
      hostelId: r.hostel_id,
      number: r.number,
      floor: r.floor,
      type: r.type,
      capacity: r.capacity,
      rentPerBed: parseFloat(r.rent_per_bed),
      facilities,
      status: r.status
    };
  });
  res.json(parsedRooms);
}));

// Get single room
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'SELECT * FROM rooms WHERE id = ?',
    [req.params.id]
  );

  if (result.length === 0) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const r = result[0];
  res.json({
    id: r.id,
    hostelId: r.hostel_id,
    number: r.number,
    floor: r.floor,
    type: r.type,
    capacity: r.capacity,
    rentPerBed: parseFloat(r.rent_per_bed),
    facilities: r.facilities ? JSON.parse(r.facilities) : [],
    status: r.status
  });
}));

// Create room
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { hostelId, number, floor, type, capacity, rentPerBed, facilities } = req.body;

  console.log('Room creation request:', { hostelId, number, floor, type, capacity, rentPerBed, user: req.user });

  if (!hostelId || !number || !floor || !type || !capacity || !rentPerBed) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && hostelId !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const id = `${hostelId}_r${floor}${number.toString().padStart(2, '0')}`;
  console.log('Generated room ID:', id);
  
  await pool.query(
    'INSERT INTO rooms (id, hostel_id, number, floor, type, capacity, rent_per_bed, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, hostelId, number, floor, type, capacity, rentPerBed, facilities ? JSON.stringify(facilities) : JSON.stringify([])]
  );

  // Update hostel stats
  await pool.query(
    'UPDATE hostels SET total_rooms = total_rooms + 1 WHERE id = ?',
    [hostelId]
  );

  res.status(201).json({ id, message: 'Room created successfully' });
}));

// Update room
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { number, floor, type, capacity, rentPerBed, facilities, status } = req.body;

  // Check permissions
  const [result] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (number !== undefined) {
    updates.push('number = ?');
    values.push(number);
  }
  if (floor !== undefined) {
    updates.push('floor = ?');
    values.push(floor);
  }
  if (type !== undefined) {
    updates.push('type = ?');
    values.push(type);
  }
  if (capacity !== undefined) {
    updates.push('capacity = ?');
    values.push(capacity);
  }
  if (rentPerBed !== undefined) {
    updates.push('rent_per_bed = ?');
    values.push(rentPerBed);
  }
  if (facilities !== undefined) {
    updates.push('facilities = ?');
    values.push(JSON.stringify(facilities));
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);
  await pool.query(
    `UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  res.json({ message: 'Room updated successfully' });
}));

// Delete room
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  // Check permissions
  const [result] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const hostelId = result[0].hostel_id;
  await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);

  // Update hostel stats
  await pool.query(
    'UPDATE hostels SET total_rooms = total_rooms - 1 WHERE id = ?',
    [hostelId]
  );

  res.json({ message: 'Room deleted successfully' });
}));

export default router;
