import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';
import { AuthRequest } from '../types';

const router = Router();
router.use(requireAuth);

interface OrderRow {
  id: string;
  seller_id: string;
  product_id: string | null;
  customer_id: string | null;
  amount: string;
  currency: string;
  status: string;
  paystack_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// GET /orders
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.seller!.id;
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    if (status) {
      const { rows } = await query<OrderRow>(
        `SELECT o.*, c.name as customer_name, p.title as product_title
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN products p ON p.id = o.product_id
         WHERE o.seller_id = $1 AND o.status = $2
         ORDER BY o.created_at DESC LIMIT $3 OFFSET $4`,
        [sellerId, status, limitNum, offset]
      );
      const count = await query<{ count: string }>(
        'SELECT COUNT(*) FROM orders WHERE seller_id = $1 AND status = $2',
        [sellerId, status]
      );
      res.json({ orders: rows, total: parseInt(count.rows[0].count, 10), page: pageNum, limit: limitNum });
      return;
    }

    const { rows } = await query<OrderRow>(
      `SELECT o.*, c.name as customer_name, p.title as product_title
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN products p ON p.id = o.product_id
       WHERE o.seller_id = $1
       ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`,
      [sellerId, limitNum, offset]
    );
    const count = await query<{ count: string }>(
      'SELECT COUNT(*) FROM orders WHERE seller_id = $1',
      [sellerId]
    );
    res.json({ orders: rows, total: parseInt(count.rows[0].count, 10), page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

// POST /orders
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.seller!.id;
    const { product_id, customer_id, amount, currency, paystack_reference } =
      req.body as Partial<OrderRow>;

    if (!amount) {
      res.status(422).json({ error: 'amount is required' });
      return;
    }

    const { rows } = await query<OrderRow>(
      `INSERT INTO orders (seller_id, product_id, customer_id, amount, currency, paystack_reference)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sellerId, product_id ?? null, customer_id ?? null, amount, currency ?? 'KES', paystack_reference ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query<OrderRow>(
      `SELECT o.*, c.name as customer_name, p.title as product_title
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN products p ON p.id = o.product_id
       WHERE o.id = $1 AND o.seller_id = $2`,
      [req.params['id'], req.seller!.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /orders/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, paystack_reference, paid_at } = req.body as Partial<OrderRow>;

    const { rows } = await query<OrderRow>(
      `UPDATE orders
       SET status = COALESCE($1, status),
           paystack_reference = COALESCE($2, paystack_reference),
           paid_at = COALESCE($3, paid_at),
           updated_at = NOW()
       WHERE id = $4 AND seller_id = $5
       RETURNING *`,
      [status ?? null, paystack_reference ?? null, paid_at ?? null, req.params['id'], req.seller!.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /orders/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM orders WHERE id = $1 AND seller_id = $2',
      [req.params['id'], req.seller!.id]
    );
    if (!rowCount) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
