const { Pool } = require('pg');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:sd_secret@172.18.0.17:5432/samachar_daily'
});

async function backfill() {
  let scanned = 0;
  let updated = 0;
  let failed = 0;

  try {
    const res = await pool.query(
      "SELECT id, source_url FROM articles WHERE source_name ILIKE 'TV9 Marathi%' AND (thumbnail_url IS NULL OR thumbnail_url = '') LIMIT 100"
    );
    
    console.log('Found ' + res.rows.length + ' articles to backfill');

    for (const row of res.rows) {
      scanned++;
      try {
        const response = await axios.get(row.source_url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(response.data);
        const imageUrl = meta[property="og:image"].attr('content') || meta[name="twitter:image"].attr('content');

        if (imageUrl) {
          await pool.query(
            "UPDATE articles SET thumbnail_url = , updated_at = NOW() WHERE id = ",
            [imageUrl, row.id]
          );
          updated++;
        }
      } catch (err) {
        console.error('Failed to process ' + row.source_url + ': ' + err.message);
        failed++;
      }
    }
  } catch (err) {
    console.error('Error during backfill script execution:', err);
  }

  console.log('RESULT: scanned=' + scanned + ', updated=' + updated + ', failed=' + failed);
  
  try {
    const targetRes = await pool.query(
      "SELECT title, thumbnail_url FROM articles WHERE source_url LIKE '%akola-bhondu-baba-chetan-maharaj-case-filed-for-torturing-children-1653522%'"
    );
    if (targetRes.rows.length > 0) {
      console.log('TARGET_CHECK: ' + JSON.stringify(targetRes.rows[0]));
    } else {
      console.log('TARGET_CHECK: Not Found');
    }
  } catch (err) {
    console.error('Error during target check:', err);
  }

  await pool.end();
}

backfill();
