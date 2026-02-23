import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations/001_initial.sql'),
    'utf8'
  );
  try {
    await pool.query(sql);
    console.log('Migration complete');
  } finally {
    await pool.end();
  }
}

migrate().catch(console.error);
