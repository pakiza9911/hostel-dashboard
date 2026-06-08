import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all tickets (scoped by hostel)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  let query = 'SELECT * FROM maintenance_tickets';
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' WHERE hostel_id = ?';
    params.push(req.user.hostelId);
  }

  const [tickets] = await pool.query(query, params);
  res.json(tickets.map((t) => ({
    id: t.id,
    hostelId: t.hostel_id,
    roomId: t.room_id,
    tenantId: t.tenant_id,
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    assignedTo: t.assigned_to,
    createdAt: t.created_at,
    resolvedAt: t.resolved_at
  })));
}));

// Get single ticket
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'SELECT * FROM maintenance_tickets WHERE id = ?',
    [req.params.id]
  );

  if (result.length === 0) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const t = result[0];
  res.json({
    id: t.id,
    hostelId: t.hostel_id,
    roomId: t.room_id,
    tenantId: t.tenant_id,
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    assignedTo: t.assigned_to,
    createdAt: t.created_at,
    resolvedAt: t.resolved_at
  });
}));

// Create ticket
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { hostelId, roomId, tenantId, title, description, category, priority } = req.body;

  if (!hostelId || !title || !category) {
    return res.status(400).json({ error: 'Hostel ID, title, and category required' });
  }

  // Check permissions
  if (req.user.role !== 'super_admin' && hostelId !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const id = `tk_${Date.now()}`;
  await pool.query(
    'INSERT INTO maintenance_tickets (id, hostel_id, room_id, tenant_id, title, description, category, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, hostelId, roomId || null, tenantId || null, title, description || null, category, priority || 'medium']
  );

  res.status(201).json({ id, message: 'Ticket created successfully' });
}));

// Update ticket
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { title, description, category, priority, status, assignedTo } = req.body;

  // Check permissions
  const [result] = await pool.query('SELECT * FROM maintenance_tickets WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const currentTicket = result[0];
  const resolvedAt = (status === 'resolved' || status === 'closed') && currentTicket.status !== 'resolved' && currentTicket.status !== 'closed' 
    ? new Date().toISOString() 
     : currentTicket.resolved_at;

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    values.push(category);
  }
  if (priority !== undefined) {
    updates.push('priority = ?');
    values.push(priority);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }
  if (assignedTo !== undefined) {
    updates.push('assigned_to = ?');
    values.push(assignedTo);
  }
  if (status !== undefined && (status === 'resolved' || status === 'closed')) {
    updates.push('resolved_at = ?');
    values.push(resolvedAt);
  }

  if (result.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);
  await pool.query(
    `UPDATE maintenance_tickets SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  res.json({ message: 'Ticket updated successfully' });
}));

// Delete ticket
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  // Check permissions
  const [result] = await pool.query('SELECT * FROM maintenance_tickets WHERE id = ?', [req.params.id]);
  if (result.length === 0) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (req.user.role !== 'super_admin' && result[0].hostel_id !== req.user.hostelId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  await pool.query('DELETE FROM maintenance_tickets WHERE id = ?', [req.params.id]);
  res.json({ message: 'Ticket deleted successfully' });
}));

export default router;
