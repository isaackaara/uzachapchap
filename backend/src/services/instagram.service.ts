const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

// Mock mode activates when INSTAGRAM_APP_ID is missing or set to the placeholder
export const IS_MOCK_MODE =
  !process.env.INSTAGRAM_APP_ID ||
  process.env.INSTAGRAM_APP_ID === 'your-app-id' ||
  process.env.INSTAGRAM_APP_ID === 'your_instagram_app_id';

export interface IgPost {
  id: string;
  caption?: string;
  media_url?: string;
  timestamp: string;
}

// 16 Kenyan thrift store products for mock data
const MOCK_PRODUCTS: Array<{ title: string; description: string; price: number }> = [
  { title: 'Vintage Denim Jacket - Size M', description: 'Classic blue denim jacket, lightly worn. Perfect for layering.', price: 1500 },
  { title: 'Nike Air Force 1 - Size 42', description: 'White AF1s, minor scuffs on sole. 8/10 condition.', price: 3500 },
  { title: 'Floral Maxi Dress', description: 'Beautiful summer maxi dress with floral print. Fits size 10-12.', price: 800 },
  { title: 'Leather Crossbody Bag', description: 'Brown genuine leather crossbody. Adjustable strap.', price: 2200 },
  { title: 'Adidas Track Pants - Size L', description: 'Navy blue Adidas tracksuit bottoms. Three stripe classic.', price: 1200 },
  { title: 'Cashmere Sweater - Cream', description: 'Soft cashmere pullover. No pilling. Excellent condition.', price: 2800 },
  { title: 'Converse High Tops - Size 40', description: 'Red Chuck Taylor All Stars. Barely worn.', price: 2000 },
  { title: 'Silk Blouse - Emerald Green', description: 'Elegant silk blouse. Perfect for office or evening wear.', price: 1800 },
  { title: 'Levi\'s 501 Jeans - W32 L32', description: 'Original Levi\'s 501s. Medium wash, great fade.', price: 2500 },
  { title: 'Puma Suede Sneakers - Size 44', description: 'Classic Puma Suede in black/white. Good condition.', price: 1800 },
  { title: 'Wool Overcoat - Charcoal', description: 'Warm wool overcoat. Perfect for cold Nairobi mornings.', price: 4500 },
  { title: 'Ankara Print Shirt - Size M', description: 'Bold African print button-down. Handmade.', price: 1200 },
  { title: 'Timberland Boots - Size 43', description: 'Classic wheat Timbs. Waterproof. 7/10 condition.', price: 4000 },
  { title: 'Polo Ralph Lauren Tee', description: 'Navy blue polo tee. Embroidered logo. Fits like M.', price: 900 },
  { title: 'Pleated Midi Skirt - Black', description: 'Elegant pleated skirt. Elastic waist. One size fits most.', price: 700 },
  { title: 'Vintage Band T-Shirt - Nirvana', description: 'Authentic 90s Nirvana tee. Faded black. Rare find.', price: 3000 },
];

export function generateMockPosts(): IgPost[] {
  return MOCK_PRODUCTS.map((product, i) => {
    const id = `mock_ig_${(i + 1).toString().padStart(3, '0')}`;
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    // Use picsum.photos for realistic placeholder images
    const imageId = 200 + i;
    return {
      id,
      caption: `${product.title}\n\n${product.description}\n\nKES ${product.price.toLocaleString()}\n\nDM to order! 📩\n#mtumba #thriftnairobi #uzachapchap`,
      media_url: `https://picsum.photos/id/${imageId}/400/400`,
      timestamp: date.toISOString(),
    };
  });
}

// Parse price from caption text
export function parsePriceFromCaption(caption: string): number {
  const match = caption.match(/KES\s*([\d,]+)/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return 0;
}

// Parse title from caption (first line)
export function parseTitleFromCaption(caption: string): string {
  const firstLine = caption.split('\n')[0].trim();
  return firstLine || 'Untitled Product';
}

// --- Live API functions ---

export async function fetchPosts(
  pageId: string,
  accessToken: string
): Promise<IgPost[]> {
  if (IS_MOCK_MODE) {
    return generateMockPosts();
  }

  const url = `${GRAPH_API_BASE}/${pageId}/media?fields=id,caption,media_url,timestamp&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(`Instagram API error: ${err.error?.message ?? res.statusText}`);
  }
  const data = await res.json() as { data: IgPost[] };
  return data.data;
}

/**
 * NOTE: Instagram Graph API does not natively support updating captions on existing
 * media posts after publishing. In mock mode, this is a no-op that logs success.
 * When going live, post a comment ("SOLD") instead.
 */
export async function updateCaption(
  postId: string,
  caption: string,
  accessToken: string
): Promise<void> {
  if (IS_MOCK_MODE) {
    console.log(`[MOCK] Updated caption for ${postId}: ${caption.substring(0, 50)}...`);
    return;
  }

  const url = `${GRAPH_API_BASE}/${postId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption, access_token: accessToken }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(`Instagram caption update error: ${err.error?.message ?? res.statusText}`);
  }
}

export async function sendDM(
  recipientId: string,
  message: string,
  accessToken: string
): Promise<void> {
  if (IS_MOCK_MODE) {
    console.log(`[MOCK] Sent DM to ${recipientId}: ${message.substring(0, 50)}...`);
    return;
  }

  const url = `${GRAPH_API_BASE}/me/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: accessToken,
    }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(`Instagram DM error: ${err.error?.message ?? res.statusText}`);
  }
}
