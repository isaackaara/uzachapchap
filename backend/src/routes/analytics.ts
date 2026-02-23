import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';
import { AuthRequest } from '../types';

const router = Router();
router.use(requireAuth);

// GET /analytics/summary
router.get('/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.seller!.id;

    const [revenueRes, ordersRes, soldTodayRes, topProductsRes] = await Promise.all([
      query<{ total_revenue: string }>(
        `SELECT COALESCE(SUM(amount), 0) as total_revenue
         FROM orders WHERE seller_id = $1 AND status = 'paid'`,
        [sellerId]
      ),
      query<{ order_count: string }>(
        `SELECT COUNT(*) as order_count FROM orders WHERE seller_id = $1`,
        [sellerId]
      ),
      query<{ sold_today: string }>(
        `SELECT COUNT(*) as sold_today FROM products
         WHERE seller_id = $1 AND status = 'sold' AND sold_at >= CURRENT_DATE`,
        [sellerId]
      ),
      query<{ id: string; title: string; revenue: string }>(
        `SELECT p.id, p.title, COALESCE(SUM(o.amount), 0) as revenue
         FROM products p
         LEFT JOIN orders o ON o.product_id = p.id AND o.status = 'paid'
         WHERE p.seller_id = $1
         GROUP BY p.id, p.title
         ORDER BY revenue DESC
         LIMIT 5`,
        [sellerId]
      ),
    ]);

    res.json({
      totalRevenue: parseFloat(revenueRes.rows[0].total_revenue),
      orderCount: parseInt(ordersRes.rows[0].order_count, 10),
      soldToday: parseInt(soldTodayRes.rows[0].sold_today, 10),
      topProducts: topProductsRes.rows.map((r) => ({
        id: r.id,
        title: r.title,
        revenue: parseFloat(r.revenue),
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
