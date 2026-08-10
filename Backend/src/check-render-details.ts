import { query } from './db';

async function checkRenderDetails() {
  console.log('--- Checking Database Connection & Dealer Uploaded Cars ---');
  try {
    const res = await query('SELECT * FROM "Cars" WHERE created_by IS NOT NULL ORDER BY created_at DESC');
    console.log(`Found ${res.rows.length} dealer-uploaded car listings:`);
    console.log(res.rows);
  } catch (err: any) {
    console.error('Error querying database:', err.message || err);
  }
}

// Execute if run directly
if (require.main === module) {
  checkRenderDetails().then(() => {
    console.log('Check completed.');
  }).catch((err) => {
    console.error('Execution failed:', err);
  });
}

export { checkRenderDetails };
