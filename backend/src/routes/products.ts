import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';
import { enqueueJob } from '../services/jobs.service';
import { AuthRequest } from '../types';

const router = Router();
router.use(requireAuth);

interface ProductRow {
  id: string;
  seller_id: string;
  channel_id: string | null;
  external_id: string | null;
  title: string;
  description: string | null;
  price: string;
  currency: string;
  status: string;
  media_urls: unknown[];
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

// GET /products
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.seller!.id;
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const params: unknown[] = [sellerId, limitNum, offset];
    let whereClause = 'WHERE seller_id = $1';

    if (status) {
      params.splice(1, 0, status);
      whereClause += ` AND status = $2`;
      params[params.indexOf(limitNum)] = limitNum;
      // rebuild cleanly
      const statusParams = [sellerId, status, limitNum, offset];
      const { rows } = await query<ProductRow>(
        `SELECT * FROM products WHERE seller_id = $1 AND status = $2
         ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
        statusParams
      );
      const count = await query<{ count: string }>(
        'SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = $2',
        [sellerId, status]
      );
      res.json({ products: rows, total: parseInt(count.rows[0].count, 10), page: pageNum, limit: limitNum });
      return;
    }

    const { rows } = await query<ProductRow>(
      `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [sellerId, limitNum, offset]
    );
    const count = await query<{ count: string }>(
      'SELECT COUNT(*) FROM products WHERE seller_id = $1',
      [sellerId]
    );
    res.json({ products: rows, total: parseInt(count.rows[0].count, 10), page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

// POST /products
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.seller!.id;
    const { title, description, price, currency, status, media_urls, channel_id, external_id } =
      req.body as Partial<ProductRow>;

    if (!title || price === undefined || price === null) {
      res.status(422).json({ error: 'title and price are required' });
      return;
    }

    const { rows } = await query<ProductRow>(
      `INSERT INTO products (seller_id, channel_id, external_id, title, description, price, currency, status, media_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        sellerId,
        channel_id ?? null,
        external_id ?? null,
        title,
        description ?? null,
        price,
        currency ?? 'KES',
        status ?? 'available',
        JSON.stringify(media_urls ?? []),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /products/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query<ProductRow>(
      'SELECT * FROM products WHERE id = $1 AND seller_id = $2',
      [req.params['id'], req.seller!.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /products/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, price, currency, status, media_urls, channel_id, external_id } =
      req.body as Partial<ProductRow>;

    const { rows } = await query<ProductRow>(
      `UPDATE products
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           currency = COALESCE($4, currency),
           status = COALESCE($5, status),
           media_urls = COALESCE($6, media_urls),
           channel_id = COALESCE($7, channel_id),
           external_id = COALESCE($8, external_id),
           updated_at = NOW()
       WHERE id = $9 AND seller_id = $10
       RETURNING *`,
      [
        title ?? null,
        description ?? null,
        price ?? null,
        currency ?? null,
        status ?? null,
        media_urls ? JSON.stringify(media_urls) : null,
        channel_id ?? null,
        external_id ?? null,
        req.params['id'],
        req.seller!.id,
      ]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /products/:id (soft delete via status='hidden')
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rowCount } = await query(
      `UPDATE products SET status = 'hidden', updated_at = NOW() WHERE id = $1 AND seller_id = $2`,
      [req.params['id'], req.seller!.id]
    );
    if (!rowCount) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PATCH /products/:id/mark-sold
router.patch('/:id/mark-sold', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query<ProductRow>(
      `UPDATE products
       SET status = 'sold', sold_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND seller_id = $2
       RETURNING *`,
      [req.params['id'], req.seller!.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const product = rows[0];

    if (product.channel_id) {
      const channelRes = await query<{ access_token_encrypted: string; page_id: string }>(
        'SELECT access_token_encrypted, page_id FROM channels WHERE id = $1',
        [product.channel_id]
      );
      const ch = channelRes.rows[0];
      if (ch?.access_token_encrypted) {
        const accessToken = Buffer.from(ch.access_token_encrypted, 'base64').toString('utf8');
        await enqueueJob(req.seller!.id, 'update_ig_caption', {
          postId: product.external_id ?? product.id,
          caption: `[SOLD] ${product.title}`,
          accessToken,
        });
        await enqueueJob(req.seller!.id, 'send_ig_dm', {
          recipientId: ch.page_id,
          message: `Your item "${product.title}" has been marked as sold.`,
          accessToken,
        });
      }
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
