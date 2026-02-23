import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { verifyWebhookSignature } from '../services/paystack.service';

const router = Router();

interface PaystackEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    customer: {
      email: string;
    };
  };
}

interface IgWebhookEntry {
  id: string;
  changes?: Array<{
    field: string;
    value: {
      text?: string;
      from?: { id: string; username?: string };
      media?: { id: string };
    };
  }>;
  messaging?: Array<{
    sender: { id: string };
    message: { text: string };
  }>;
}

// GET /webhooks/instagram — hub.verify challenge response
router.get('/instagram', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }
  res.status(403).json({ error: 'Forbidden' });
});

// POST /webhooks/instagram — receive Instagram webhook events
router.post('/instagram', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as { object?: string; entry?: IgWebhookEntry[] };
    if (body.object !== 'instagram') {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const entries = body.entry ?? [];
    for (const entry of entries) {
      // Handle comment events
      for (const change of (entry.changes ?? [])) {
        if (change.field === 'comments') {
          console.log('Instagram comment event:', JSON.stringify(change.value));
          const text = change.value.text ?? '';
          const mediaId = change.value.media?.id;
          const fromUser = change.value.from;
          console.log(`Comment on media ${mediaId} from ${fromUser?.username ?? fromUser?.id}: "${text}"`);
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

// POST /webhooks/paystack — verify signature and handle charge.success
router.post('/paystack', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = req.body as Buffer;
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature || !verifyWebhookSignature(rawBody.toString(), signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event = JSON.parse(rawBody.toString()) as PaystackEvent;

    if (event.event === 'charge.success') {
      const { reference, amount } = event.data;
      const amountInKes = amount / 100; // convert from kobo back to KES

      const { rows } = await query<{ id: string; customer_id: string | null }>(
        `UPDATE orders
         SET status = 'paid', paid_at = NOW(), updated_at = NOW()
         WHERE paystack_reference = $1 AND status = 'pending'
         RETURNING id, customer_id`,
        [reference]
      );
      const order = rows[0];

      if (order?.customer_id) {
        await query(
          `UPDATE customers
           SET total_spent = total_spent + $1,
               order_count = order_count + 1,
               last_order_at = NOW(),
               first_order_at = COALESCE(first_order_at, NOW()),
               updated_at = NOW()
           WHERE id = $2`,
          [amountInKes, order.customer_id]
        );
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
