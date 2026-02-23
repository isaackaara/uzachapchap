import crypto from 'crypto';

interface PaystackInitParams {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function createPaymentLink(params: PaystackInitParams): Promise<string> {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amount * 100), // convert to kobo/cents
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json() as { message?: string };
    throw new Error(`Paystack error: ${err.message ?? res.statusText}`);
  }

  const data = await res.json() as PaystackInitResponse;
  return data.data.authorization_url;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET!;
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return hash === signature;
}
