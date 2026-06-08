import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all payments (scoped by hostel)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  let query = 'SELECT * FROM payments';
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' WHERE hostel_id = $1';
    params.push(req.user.hostelId);
  }

  const result = await pool.query(query, params);
  res.json(payments.map((row) => ({
    id: p.id,
    hostelId: p.hostel_id,
    tenantId: p.tenant_id,
    amount: parseFloat(p.amount),
    type: p.type,
    method: p.method,
    status: p.status,
    dueDate: p.due_date,
    paidDate: p.paid_date,
    monthFor: p.month_for,
    invoiceNumber: p.invoice_number,
    notes: p.notes
  })));
}));

// Get single payment
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM payments WHERE id = $2',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  const p = result.rows[0];
  res.json({
    id: p.id,
    hostelId: p.hostel_id,
    tenantId: p.tenant_id,
    amount: parseFloat(p.amount),
    type: p.type,
    method: p.method,
    status: p.status,
    dueDate: p.due_date,
    paidDate: p.paid_date,
    monthFor: p.month_for,
    invoiceNumber: p.invoice_number,
    notes: p.notes
  });
}));

// Create payment
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { hostelId, tenantId, amount, type, method, status, dueDate, monthFor, invoiceNumber, notes } = req.body;

  if (!hostelId || !tenantId || !amount || !type || !method || !dueDate || !monthFor || !invoiceNumber) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && hostelId !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const id = `p_${Date.now()}`;
  await pool.query(
    'INSERT INTO payments (id, hostel_id, tenant_id, amount, type, method, status, due_date, month_for, invoice_number, notes) VALUES ($3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
    [id, hostelId, tenantId, amount, type, method, status || 'pending', dueDate, monthFor, invoiceNumber, notes || null]
  );

  res.status(201).json({ id, message: 'Payment created successfully' });
}));

// Update payment
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { amount, type, method, status, dueDate, paidDate, monthFor, invoiceNumber, notes } = req.body;

  // Check permissions
  const result = await pool.query('SELECT * FROM payments WHERE id = $14', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (req.user.role !== 'super_admin' && result.rows[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (amount !== undefined) {
    updates.push('amount = $15');
    values.push(amount);
  }
  if (type !== undefined) {
    updates.push('type = $16');
    values.push(type);
  }
  if (method !== undefined) {
    updates.push('method = $17');
    values.push(method);
  }
  if (status !== undefined) {
    updates.push('status = $18');
    values.push(status);
  }
  if (dueDate !== undefined) {
    updates.push('due_date = $19');
    values.push(dueDate);
  }
  if (paidDate !== undefined) {
    updates.push('paid_date = $20');
    values.push(paidDate);
  }
  if (monthFor !== undefined) {
    updates.push('month_for = $21');
    values.push(monthFor);
  }
  if (invoiceNumber !== undefined) {
    updates.push('invoice_number = $22');
    values.push(invoiceNumber);
  }
  if (notes !== undefined) {
    updates.push('notes = $23');
    values.push(notes);
  }

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);
  await pool.query(
    `UPDATE payments SET ${updates.join(', ')} WHERE id = $24`,
    values
  );

  // Update hostel revenue if payment is marked as paid
  if (status === 'paid' && result.rows[0].status !== 'paid') {
    await pool.query(
      'UPDATE hostels SET monthly_revenue = monthly_revenue + ? WHERE id = $26',
      [amount, result.rows[0].hostel_id]
    );
  }

  res.json({ message : 'Payment updated successfully' });
}));

// Mark payment as paid
router.post('/:id/mark-paid', authenticateToken, asyncHandler(async (req, res) => {
  const { method } = req.body;

  // Check permissions
  const result = await pool.query('SELECT * FROM payments WHERE id = $27', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (req.user.role !== 'super_admin' && result.rows[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const payment = result.rows[0];

  await pool.query(
    'UPDATE payments SET status = "paid", method = $28, paid_date = CURDATE() WHERE id = $29',
    [method, req.params.id]
  );

  // Update hostel revenue
  await pool.query(
    'UPDATE hostels SET monthly_revenue = monthly_revenue + ? WHERE id = $31',
    [payment.amount, payment.hostel_id]
  );

  res.json({ message : 'Payment marked as paid' });
}));

export default router;
