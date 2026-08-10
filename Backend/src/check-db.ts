import { query, pool } from './db';

async function main() {
  const result = await query('SELECT COUNT(*) FROM "Cars"');
  console.log('Row count in database:', result.rows[0].count);
  await pool.end();
}

main().catch(console.error);
