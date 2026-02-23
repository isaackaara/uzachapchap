import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';
import { AuthRequest } from '../types';

const router = Router();
router.use(requireAuth);

interface CustomerRow {
  id: string;
  seller_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagram_handle: string | null;
  total_spent: string;
  order_count: number;
  first_order_at: string | null;
  last_order_at: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// GET /customers
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.seller!.id;
    const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    if (search) {
      const pattern = `%${search}%`;
      const { rows } = await query<CustomerRow>(
        `SELECT * FROM customers
         WHERE seller_id = $1 AND (name ILIKE $2 OR phone ILIKE $2 OR email ILIKE $2)
         ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
        [sellerId, pattern, limitNum, offset]
      );
      const count = await query<{ count: string }>(
        `SELECT COUNT(*) FROM customers WHERE seller_id = $1 AND (name ILIKE $2 OR phone ILIKE $2 OR email ILIKE $2)`,
        [sellerId, pattern]
      );
      res.json({ customers: rows, total: parseInt(count.rows[0].count, 10), page: pageNum, limit: limitNum });
      return;
    }

    const { rows } = await query<CustomerRow>(
      `SELECT * FROM customers WHERE seller_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [sellerId, limitNum, offset]
    );
    const count = await query<{ count: string }>(
      'SELECT COUNT(*) FROM customers WHERE seller_id = $1',
      [sellerId]
    );
    res.json({ customers: rows, total: parseInt(count.rows[0].count, 10), page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

// POST /customers
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.seller!.id;
    const { name, phone, email, instagram_handle, tags, notes } = req.body as Partial<CustomerRow>;

    if (!name) {
      res.status(422).json({ error: 'name is required' });
      return;
    }

    const { rows } = await query<CustomerRow>(
      `INSERT INTO customers (seller_id, name, phone, email, instagram_handle, tags, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [sellerId, name, phone ?? null, email ?? null, instagram_handle ?? null, tags ?? [], notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /customers/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query<CustomerRow>(
      'SELECT * FROM customers WHERE id = $1 AND seller_id = $2',
      [req.params['id'], req.seller!.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /customers/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email, instagram_handle, tags, notes } = req.body as Partial<CustomerRow>;

    const { rows } = await query<CustomerRow>(
      `UPDATE customers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           instagram_handle = COALESCE($4, instagram_handle),
           tags = COALESCE($5, tags),
           notes = COALESCE($6, notes),
           updated_at = NOW()
       WHERE id = $7 AND seller_id = $8
       RETURNING *`,
      [
        name ?? null,
        phone ?? null,
        email ?? null,
        instagram_handle ?? null,
        tags ?? null,
        notes ?? null,
        req.params['id'],
        req.seller!.id,
      ]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /customers/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM customers WHERE id = $1 AND seller_id = $2',
      [req.params['id'], req.seller!.id]
    );
    if (!rowCount) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /customers/:id/orders
router.get('/:id/orders', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Verify customer belongs to this seller
    const custCheck = await query<{ id: string }>(
      'SELECT id FROM customers WHERE id = $1 AND seller_id = $2',
      [req.params['id'], req.seller!.id]
    );
    if (!custCheck.rows[0]) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { rows } = await query(
      `SELECT o.*, p.title as product_title
       FROM orders o
       LEFT JOIN products p ON p.id = o.product_id
       WHERE o.customer_id = $1 AND o.seller_id = $2
       ORDER BY o.created_at DESC LIMIT $3 OFFSET $4`,
      [req.params['id'], req.seller!.id, limitNum, offset]
    );
    const count = await query<{ count: string }>(
      'SELECT COUNT(*) FROM orders WHERE customer_id = $1 AND seller_id = $2',
      [req.params['id'], req.seller!.id]
    );
    res.json({ orders: rows, total: parseInt(count.rows[0].count, 10), page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

export default router;
