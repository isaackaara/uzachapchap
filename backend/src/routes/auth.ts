import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  sendPasswordResetEmail,
} from '../services/auth.service';

const router = Router();

interface SellerRow {
  id: string;
  email: string;
  name: string;
  business_name: string | null;
  plan: string;
  password_hash: string;
}

interface RefreshTokenRow {
  id: string;
  seller_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

interface PrtRow {
  id: string;
  seller_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, business_name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      business_name?: string;
    };

    if (!email || !password || !name) {
      res.status(422).json({ error: 'email, password, and name are required' });
      return;
    }
    if (password.length < 8) {
      res.status(422).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const existing = await query<{ id: string }>('SELECT id FROM sellers WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(422).json({ error: 'Email already registered' });
      return;
    }

    const password_hash = await hashPassword(password);
    const { rows } = await query<SellerRow>(
      `INSERT INTO sellers (email, password_hash, name, business_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, business_name, plan`,
      [email, password_hash, name, business_name ?? null]
    );
    const seller = rows[0];

    const accessToken = signAccessToken({ id: seller.id, email: seller.email, plan: seller.plan });
    const refreshToken = signRefreshToken(seller.id);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await query(
      `INSERT INTO refresh_tokens (seller_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [seller.id, tokenHash, expiresAt]
    );

    res.status(201).json({
      seller: {
        id: seller.id,
        email: seller.email,
        name: seller.name,
        businessName: seller.business_name,
        plan: seller.plan,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(422).json({ error: 'email and password are required' });
      return;
    }

    const { rows } = await query<SellerRow>(
      `SELECT id, email, name, business_name, plan, password_hash FROM sellers WHERE email = $1`,
      [email]
    );
    const seller = rows[0];
    if (!seller) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await comparePassword(password, seller.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = signAccessToken({ id: seller.id, email: seller.email, plan: seller.plan });
    const refreshToken = signRefreshToken(seller.id);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await query(
      `INSERT INTO refresh_tokens (seller_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [seller.id, tokenHash, expiresAt]
    );

    res.json({
      seller: {
        id: seller.id,
        email: seller.email,
        name: seller.name,
        businessName: seller.business_name,
        plan: seller.plan,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(422).json({ error: 'refreshToken is required' });
      return;
    }

    let payload: { sellerId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const { rows } = await query<RefreshTokenRow>(
      `SELECT id, seller_id, expires_at, revoked_at FROM refresh_tokens
       WHERE token_hash = $1 AND seller_id = $2`,
      [tokenHash, payload.sellerId]
    );
    const stored = rows[0];

    if (!stored || stored.revoked_at || new Date(stored.expires_at) < new Date()) {
      res.status(401).json({ error: 'Refresh token expired or revoked' });
      return;
    }

    // Revoke old token
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
      [stored.id]
    );

    // Get seller info
    const { rows: sellerRows } = await query<SellerRow>(
      `SELECT id, email, name, business_name, plan FROM sellers WHERE id = $1`,
      [payload.sellerId]
    );
    const seller = sellerRows[0];
    if (!seller) {
      res.status(401).json({ error: 'Seller not found' });
      return;
    }

    const newAccessToken = signAccessToken({ id: seller.id, email: seller.email, plan: seller.plan });
    const newRefreshToken = signRefreshToken(seller.id);
    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await query(
      `INSERT INTO refresh_tokens (seller_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [seller.id, newHash, expiresAt]
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
        [tokenHash]
      );
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(422).json({ error: 'email is required' });
      return;
    }

    const { rows } = await query<SellerRow>('SELECT id, email FROM sellers WHERE email = $1', [email]);
    const seller = rows[0];

    if (seller) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await query(
        `INSERT INTO password_reset_tokens (seller_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [seller.id, tokenHash, expiresAt]
      );

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(seller.email, resetUrl).catch((err: unknown) => {
        console.error('Failed to send reset email:', err);
      });
    }

    // Always return 200 to prevent email enumeration
    res.json({ message: 'If that email is registered, you will receive a reset link.' });
  } catch (err) {
    next(err);
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      res.status(422).json({ error: 'token and password are required' });
      return;
    }
    if (password.length < 8) {
      res.status(422).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const tokenHash = hashToken(token);
    const { rows } = await query<PrtRow>(
      `SELECT id, seller_id, expires_at, used_at FROM password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );
    const prt = rows[0];

    if (!prt || prt.used_at || new Date(prt.expires_at) < new Date()) {
      res.status(422).json({ error: 'Token is invalid or has expired' });
      return;
    }

    const newHash = await hashPassword(password);
    await query(
      `UPDATE sellers SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, prt.seller_id]
    );

    await query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
      [prt.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
