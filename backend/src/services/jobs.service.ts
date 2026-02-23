import { query } from '../db';
import { sendDM, updateCaption, IS_MOCK_MODE } from './instagram.service';

interface JobRow {
  id: string;
  seller_id: string;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
}

export async function enqueueJob(
  sellerId: string,
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  await query(
    `INSERT INTO jobs (seller_id, type, payload, status)
     VALUES ($1, $2, $3, 'pending')`,
    [sellerId, type, JSON.stringify(payload)]
  );
}

export async function processJobs(): Promise<void> {
  const { rows } = await query<JobRow>(
    `SELECT id, seller_id, type, payload, attempts
     FROM jobs
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT 5`
  );

  for (const job of rows) {
    await query(
      `UPDATE jobs SET status = 'running', attempts = attempts + 1, updated_at = NOW()
       WHERE id = $1`,
      [job.id]
    );

    try {
      await handleJob(job);
      await query(
        `UPDATE jobs SET status = 'done', updated_at = NOW() WHERE id = $1`,
        [job.id]
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await query(
        `UPDATE jobs SET status = 'failed', error = $2, updated_at = NOW() WHERE id = $1`,
        [job.id, errorMsg]
      );
    }
  }
}

async function handleJob(job: JobRow): Promise<void> {
  const p = job.payload;

  if (IS_MOCK_MODE) {
    // In mock mode, log and mark as done
    console.log(`[MOCK JOB] Processing ${job.type}:`, JSON.stringify(p).substring(0, 100));
    return;
  }

  switch (job.type) {
    case 'update_ig_caption': {
      const postId = p['postId'] as string;
      const caption = p['caption'] as string;
      const accessToken = p['accessToken'] as string;
      await updateCaption(postId, caption, accessToken);
      break;
    }
    case 'send_ig_dm': {
      const recipientId = p['recipientId'] as string;
      const message = p['message'] as string;
      const accessToken = p['accessToken'] as string;
      await sendDM(recipientId, message, accessToken);
      break;
    }
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

export function startJobWorker(): void {
  setInterval(() => {
    processJobs().catch((err: unknown) => {
      console.error('Job worker error:', err);
    });
  }, 30000);
  console.log(`Job worker started (interval: 30s, mock: ${IS_MOCK_MODE})`);
}
