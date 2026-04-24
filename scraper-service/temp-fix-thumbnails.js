const { Pool } = require('pg');
const axios = require('axios');
const cheerio = require('cheerio');

const pool = new Pool({
  user: 'sd_user',
  host: 'localhost',
  database: 'samachar_daily',
  password: 'sd_secret',
  port: 5432,
});

async function run() {
  const client = await pool.connect();
  let scanned = 0;
  let updated = 0;
  let failed = 0;

  try {
    const res = await client.query(
      "SELECT id, source_url FROM articles WHERE source_name ILIKE 'TV9 Marathi%' AND (thumbnail_url IS NULL OR thumbnail_url = '') LIMIT 500"
    );

    console.log(`Found ${res.rows.length} articles to backfill`);

    for (const row of res.rows) {
      scanned++;
      try {
        const response = await axios.get(row.source_url, {
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const $ = cheerio.load(response.data);
        const imageUrl = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');

        if (imageUrl) {
          await client.query(
            "UPDATE articles SET thumbnail_url = $1, updated_at = NOW() WHERE id = $2",
            [imageUrl, row.id]
          );
          updated++;
          if (updated % 10 === 0) console.log(`Progress: updated ${updated}/${scanned}`);
        } else {
          console.log(`No image found for: ${row.source_url}`);
        }
      } catch (err) {
        failed++;
        console.error(`Error (${row.id}): ${err.message}`);
      }
    }

    console.log(`\nSummary: Scanned ${scanned}, Updated ${updated}, Failed ${failed}`);

    const checkRes = await client.query(
      "SELECT COUNT(*) FROM articles WHERE source_name ILIKE 'TV9 Marathi%' AND (thumbnail_url IS NULL OR thumbnail_url = '')"
    );
    console.log(`Remaining articles without thumbnail: ${checkRes.rows[0].count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
