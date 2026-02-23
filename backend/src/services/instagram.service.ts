const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

export interface IgPost {
  id: string;
  caption?: string;
  media_url?: string;
  timestamp: string;
}

export async function fetchPosts(
  pageId: string,
  accessToken: string
): Promise<IgPost[]> {
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
 * media posts after publishing. This function implements the API call structure but
 * will return an error from the API in practice. Caption updates require deleting
 * and re-publishing the post, or using comment-based workarounds.
 */
export async function updateCaption(
  postId: string,
  caption: string,
  accessToken: string
): Promise<void> {
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
