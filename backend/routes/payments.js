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
    query += ' WHERE hostel_id = ?';
    params.push(req.user.hostelId);
  }

  const [payments] = await pool.query(query, params);
  res.json(payments.map((p) => ({
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
  const [result] = await pool.query(
    'SELECT * FROM payments WHERE id = ?',
    [req.params.id]
  );

  if (result.length === 0) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  const p = result[0];
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
    'INSERT INTO payments (id, hostel_id, tenant_id, amount, type, method, status, due_date, month_for, invoice_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, hostelId, tenantId, amount, type, method, status || 'pending', dueDate, monthFor, invoiceNumber, notes || null]
  );

  res.status(201).json({ id, message: 'Payment created successfully' });
}));

// Update payment
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { amount, type, method, status, dueDate, paidDate, monthFor, invoiceNumber, notes } = req.body;

  // Check permissions
  const [result] = await pool.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (amount !== undefined) {
    updates.push('amount = ?');
    values.push(amount);
  }
  if (type !== undefined) {
    updates.push('type = ?');
    values.push(type);
  }
  if (method !== undefined) {
    updates.push('method = ?');
    values.push(method);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }
  if (dueDate !== undefined) {
    updates.push('due_date = ?');
    values.push(dueDate);
  }
  if (paidDate !== undefined) {
    updates.push('paid_date = ?');
    values.push(paidDate);
  }
  if (monthFor !== undefined) {
    updates.push('month_for = ?');
    values.push(monthFor);
  }
  if (invoiceNumber !== undefined) {
    updates.push('invoice_number = ?');
    values.push(invoiceNumber);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }

  if (result.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);
  await pool.query(
    `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // Update hostel revenue if payment is marked as paid
  if (status === 'paid' && result[0].status !== 'paid') {
    await pool.query(
      'UPDATE hostels SET monthly_revenue = monthly_revenue + ? WHERE id = ?',
      [amount, result[0].hostel_id]
    );
  }

  res.json({ message : 'Payment updated successfully' });
}));

// Mark payment as paid
router.post('/:id/mark-paid', authenticateToken, asyncHandler(async (req, res) => {
  const { method } = req.body;

  // Check permissions
  const [result] = await pool.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const payment = result[0];

  await pool.query(
    'UPDATE payments SET status = "paid", method = ?, paid_date = CURDATE() WHERE id = ?',
    [method, req.params.id]
  );

  // Update hostel revenue
  await pool.query(
    'UPDATE hostels SET monthly_revenue = monthly_revenue + ? WHERE id = ?',
    [payment.amount, payment.hostel_id]
  );

  res.json({ message : 'Payment marked as paid' });
}));

export default router;
