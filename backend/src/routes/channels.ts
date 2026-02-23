import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';
import { AuthRequest } from '../types';

const router = Router();
router.use(requireAuth);

interface ChannelRow {
  id: string;
  seller_id: string;
  platform: string;
  access_token_encrypted: string | null;
  page_id: string | null;
  username: string | null;
  connected_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface IgTokenResponse {
  access_token: string;
  token_type: string;
}

interface IgMeResponse {
  id: string;
  name: string;
  username?: string;
}

// GET /channels
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query<ChannelRow>(
      'SELECT * FROM channels WHERE seller_id = $1 ORDER BY created_at DESC',
      [req.seller!.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// DELETE /channels/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM channels WHERE id = $1 AND seller_id = $2',
      [req.params['id'], req.seller!.id]
    );
    if (!rowCount) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /channels/instagram/connect
router.post('/instagram/connect', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code, redirect_uri } = req.body as { code?: string; redirect_uri?: string };
    if (!code || !redirect_uri) {
      res.status(422).json({ error: 'code and redirect_uri are required' });
      return;
    }

    // Exchange code for access token via Instagram Graph API
    const tokenUrl = new URL('https://api.instagram.com/oauth/access_token');
    const body = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri,
      code,
    });

    const tokenRes = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json() as { error_message?: string };
      res.status(422).json({ error: err.error_message ?? 'Failed to exchange code for token' });
      return;
    }

    const tokenData = await tokenRes.json() as IgTokenResponse;
    const accessToken = tokenData.access_token;

    // Get IG user info
    const meRes = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,username&access_token=${accessToken}`
    );
    const meData = await meRes.json() as IgMeResponse;

    // Encrypt token (base64 for now)
    const encryptedToken = Buffer.from(accessToken).toString('base64');

    const { rows } = await query<ChannelRow>(
      `INSERT INTO channels (seller_id, platform, access_token_encrypted, page_id, username, connected_at)
       VALUES ($1, 'instagram', $2, $3, $4, NOW())
       RETURNING *`,
      [req.seller!.id, encryptedToken, meData.id, meData.username ?? meData.name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
