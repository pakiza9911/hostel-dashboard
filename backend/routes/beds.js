import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all beds (scoped by hostel)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  let query = 'SELECT * FROM beds';
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' WHERE hostel_id = $1';
    params.push(req.user.hostelId);
  }

  const result = await pool.query(query, params);
  res.json(beds.map((row) => ({
    id: b.id,
    roomId: b.room_id,
    hostelId: b.hostel_id,
    label: b.label,
    tenantId: b.tenant_id,
    status: b.status
  })));
}));

// Get single bed
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM beds WHERE id = $2',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Bed not found' });
  }

  const b = result.rows[0];
  res.json({
    id: b.id,
    roomId: b.room_id,
    hostelId: b.hostel_id,
    label: b.label,
    tenantId: b.tenant_id,
    status: b.status
  });
}));

// Create bed
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { roomId, hostelId, label } = req.body;

  if (!roomId || !hostelId || !label) {
    return res.status(400).json({ error: 'Room ID, hostel ID, and label required' });
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && hostelId !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const id = `${roomId}_b${label}`;
  await pool.query(
    'INSERT INTO beds (id, room_id, hostel_id, label) VALUES ($3, $4, $5, $6)',
    [id, roomId, hostelId, label]
  );

  // Update hostel stats
  await pool.query(
    'UPDATE hostels SET total_beds = total_beds + 1 WHERE id = $7',
    [hostelId]
  );

  res.status(201).json({ id, message: 'Bed created successfully' });
}));

// Update bed (assign/unassign tenant)
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { tenantId, status } = req.body;

  // Check permissions
  const result = await pool.query('SELECT * FROM beds WHERE id = $8', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Bed not found' });
  }

  if (req.user.role !== 'super_admin' && result.rows[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const currentBed = result.rows[0];
  const hostelId = currentBed.hostel_id;

  // If assigning a new tenant, free the old bed
  if (tenantId && tenantId !== currentBed.tenant_id) {
    await pool.query(
      'UPDATE beds SET tenant_id = NULL, status = "vacant" WHERE tenant_id = $9',
      [tenantId]
    );
  }

  await pool.query(
    'UPDATE beds SET tenant_id = $10, status = ? WHERE id = $12',
    [tenantId || null, status || (tenantId ? 'occupied'   : 'vacant'), req.params.id]
  );

  // Update hostel occupied beds count
  if (tenantId && !currentBed.tenant_id) {
    await pool.query(
      'UPDATE hostels SET occupied_beds = occupied_beds + 1 WHERE id = $14',
      [hostelId]
    );
  } else if (!tenantId && currentBed.tenant_id) {
    await pool.query(
      'UPDATE hostels SET occupied_beds = occupied_beds - 1 WHERE id = $15',
      [hostelId]
    );
  }

  res.json({ message: 'Bed updated successfully' });
}));

// Delete bed
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  // Check permissions
  const result = await pool.query('SELECT * FROM beds WHERE id = $16', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Bed not found' });
  }

  if (req.user.role !== 'super_admin' && result.rows[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const hostelId = result.rows[0].hostel_id;
  const wasOccupied = result.rows[0].tenant_id !== null;
  
  await pool.query('DELETE FROM beds WHERE id = $17', [req.params.id]);

  // Update hostel stats
  await pool.query(
    'UPDATE hostels SET total_beds = total_beds - 1 WHERE id = $18',
    [hostelId]
  );

  if (wasOccupied) {
    await pool.query(
      'UPDATE hostels SET occupied_beds = occupied_beds - 1 WHERE id = $19',
      [hostelId]
    );
  }

  res.json({ message: 'Bed deleted successfully' });
}));

export default router;
