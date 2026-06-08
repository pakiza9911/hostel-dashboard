import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all tenants (scoped by hostel)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  let query = 'SELECT * FROM tenants';
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' WHERE hostel_id = ?';
    params.push(req.user.hostelId);
  }

  const [tenants] = await pool.query(query, params);
  res.json(tenants.map((t) => ({
    id: t.id,
    hostelId: t.hostel_id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    gender: t.gender,
    idType: t.id_type,
    idNumber: t.id_number,
    emergencyContactName: t.emergency_contact_name,
    emergencyContactPhone: t.emergency_contact_phone,
    address: t.address,
    bedId: t.bed_id,
    roomId: t.room_id,
    joinDate: t.join_date,
    checkoutDate: t.checkout_date,
    monthlyRent: parseFloat(t.monthly_rent),
    securityDeposit: parseFloat(t.security_deposit),
    status: t.status,
    occupation: t.occupation,
    notes: t.notes
  })));
}));

// Get single tenant
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'SELECT * FROM tenants WHERE id = ?',
    [req.params.id]
  );

  if (result.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const t = result[0];
  res.json({
    id: t.id,
    hostelId: t.hostel_id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    gender: t.gender,
    idType: t.id_type,
    idNumber: t.id_number,
    emergencyContactName: t.emergency_contact_name,
    emergencyContactPhone: t.emergency_contact_phone,
    address: t.address,
    bedId: t.bed_id,
    roomId: t.room_id,
    joinDate: t.join_date,
    checkoutDate: t.checkout_date,
    monthlyRent: parseFloat(t.monthly_rent),
    securityDeposit: parseFloat(t.security_deposit),
    status: t.status,
    occupation: t.occupation,
    notes: t.notes
  });
}));

// Create tenant
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { hostelId, name, email, phone, gender, idType, idNumber, emergencyContactName, emergencyContactPhone, address, monthlyRent, securityDeposit, occupation } = req.body;

  if (!hostelId || !name || !email || !gender || !idType || !monthlyRent || !securityDeposit) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && hostelId !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const id = `t_${Date.now()}`;
  await pool.query(
    'INSERT INTO tenants (id, hostel_id, name, email, phone, gender, id_type, id_number, emergency_contact_name, emergency_contact_phone, address, join_date, monthly_rent, security_deposit, status, occupation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)',
    [id, hostelId, name, email, phone || null, gender, idType, idNumber || null, emergencyContactName || null, emergencyContactPhone || null, address || null, monthlyRent, securityDeposit, 'pending', occupation || null]
  );

  res.status(201).json({ id, message: 'Tenant created successfully' });
}));

// Update tenant
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { name, email, phone, gender, idType, idNumber, emergencyContactName, emergencyContactPhone, address, monthlyRent, securityDeposit, status, occupation, notes, bedId, roomId, checkoutDate } = req.body;

  // Check permissions
  const [result] = await pool.query('SELECT * FROM tenants WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (gender !== undefined) {
    updates.push('gender = ?');
    values.push(gender);
  }
  if (idType !== undefined) {
    updates.push('id_type = ?');
    values.push(idType);
  }
  if (idNumber !== undefined) {
    updates.push('id_number = ?');
    values.push(idNumber);
  }
  if (emergencyContactName !== undefined) {
    updates.push('emergency_contact_name = ?');
    values.push(emergencyContactName);
  }
  if (emergencyContactPhone !== undefined) {
    updates.push('emergency_contact_phone = ?');
    values.push(emergencyContactPhone);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }
  if (monthlyRent !== undefined) {
    updates.push('monthly_rent = ?');
    values.push(monthlyRent);
  }
  if (securityDeposit !== undefined) {
    updates.push('security_deposit = ?');
    values.push(securityDeposit);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }
  if (occupation !== undefined) {
    updates.push('occupation = ?');
    values.push(occupation);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }
  if (bedId !== undefined) {
    updates.push('bed_id = ?');
    values.push(bedId);
  }
  if (roomId !== undefined) {
    updates.push('room_id = ?');
    values.push(roomId);
  }
  if (checkoutDate !== undefined) {
    updates.push('checkout_date = ?');
    values.push(checkoutDate);
  }

  if (result.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);
  await pool.query(
    `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  res.json({ message: 'Tenant updated successfully' });
}));

// Delete tenant
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  // Check permissions
  const [result] = await pool.query('SELECT * FROM tenants WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const tenant = result[0];
  
  // Free the bed if assigned
  if (tenant.bed_id) {
    await pool.query(
      'UPDATE beds SET tenant_id = NULL, status = "vacant" WHERE id = ?',
      [tenant.bed_id]
    );
    await pool.query(
      'UPDATE hostels SET occupied_beds = occupied_beds - 1 WHERE id = ?',
      [tenant.hostel_id]
    );
  }

  await pool.query('DELETE FROM tenants WHERE id = ?', [req.params.id]);
  res.json({ message: 'Tenant deleted successfully' });
}));

// Checkout tenant
router.post('/:id/checkout', authenticateToken, asyncHandler(async (req, res) => {
  // Check permissions
  const [result] = await pool.query('SELECT * FROM tenants WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const tenant = result[0];

  // Free the bed
  if (tenant.bed_id) {
    await pool.query(
      'UPDATE beds SET tenant_id = NULL, status = "vacant" WHERE id = ?',
      [tenant.bed_id]
    );
    await pool.query(
      'UPDATE hostels SET occupied_beds = occupied_beds - 1 WHERE id = ?',
      [tenant.hostel_id]
    );
  }

  await pool.query(
    'UPDATE tenants SET status = "checked_out", checkout_date = CURDATE(), bed_id = NULL, room_id = NULL WHERE id = ?',
    [req.params.id]
  );

  res.json({ message: 'Tenant checked out successfully' });
}));

export default router;
