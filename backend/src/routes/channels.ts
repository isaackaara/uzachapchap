import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';
import { AuthRequest } from '../types';
import {
  IS_MOCK_MODE,
  fetchPosts,
  parseTitleFromCaption,
  parsePriceFromCaption,
} from '../services/instagram.service';

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

// POST /channels/instagram/mock-connect
// Creates a channel from just a username (no OAuth needed)
router.post('/instagram/mock-connect', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username } = req.body as { username?: string };
    if (!username) {
      res.status(422).json({ error: 'username is required' });
      return;
    }

    // Check if already connected
    const existing = await query<ChannelRow>(
      "SELECT id FROM channels WHERE seller_id = $1 AND platform = 'instagram' AND is_active = true",
      [req.seller!.id]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Instagram channel already connected. Disconnect first.' });
      return;
    }

    const mockPageId = `mock_page_${Date.now()}`;
    const mockToken = Buffer.from(`mock_token_${username}_${Date.now()}`).toString('base64');

    const { rows } = await query<ChannelRow>(
      `INSERT INTO channels (seller_id, platform, access_token_encrypted, page_id, username, connected_at, is_active)
       VALUES ($1, 'instagram', $2, $3, $4, NOW(), true)
       RETURNING *`,
      [req.seller!.id, mockToken, mockPageId, username.replace(/^@/, '')]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /channels/:id/sync
// Fetches posts from Instagram (or mock) and inserts them as products
router.post('/:id/sync', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const channelId = req.params['id'];

    // Verify channel ownership
    const { rows: channelRows } = await query<ChannelRow>(
      'SELECT * FROM channels WHERE id = $1 AND seller_id = $2',
      [channelId, req.seller!.id]
    );

    if (!channelRows.length) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const channel = channelRows[0];
    const accessToken = channel.access_token_encrypted
      ? Buffer.from(channel.access_token_encrypted, 'base64').toString()
      : '';

    // Fetch posts (mock or real)
    const posts = await fetchPosts(channel.page_id ?? '', accessToken);

    let imported = 0;

    for (const post of posts) {
      // Skip posts we already imported (by external_id)
      const existing = await query(
        'SELECT id FROM products WHERE external_id = $1 AND seller_id = $2',
        [post.id, req.seller!.id]
      );
      if (existing.rows.length > 0) continue;

      const title = parseTitleFromCaption(post.caption ?? '');
      const price = parsePriceFromCaption(post.caption ?? '');
      const mediaUrls = post.media_url ? [post.media_url] : [];

      await query(
        `INSERT INTO products (seller_id, channel_id, external_id, title, description, price, currency, status, media_urls, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'KES', 'available', $7, NOW(), NOW())`,
        [
          req.seller!.id,
          channelId,
          post.id,
          title,
          post.caption ?? '',
          price || 500, // fallback price if not parsed
          JSON.stringify(mediaUrls),
        ]
      );
      imported++;
    }

    res.json({ imported, total: posts.length, message: `Synced ${imported} new products from ${posts.length} posts` });
  } catch (err) {
    next(err);
  }
});

// POST /channels/instagram/connect (Live OAuth - kept for when credentials are available)
router.post('/instagram/connect', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (IS_MOCK_MODE) {
      res.status(400).json({ error: 'Instagram API credentials not configured. Use mock-connect instead.' });
      return;
    }

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
