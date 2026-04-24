const { scrapeRSSSource } = require('./src/scrapers/rss');
const mrSources = require('./src/sources/mr');

async function run() {
  const source = mrSources.find(s => s.name === 'TV9 Marathi' && s.url === 'https://www.tv9marathi.com/rss');
  if (!source) {
    console.error('Source not found');
    return;
  }

  try {
    const articles = await scrapeRSSSource(source);
    const target = articles.find(a => a.source_url.includes('1653522'));
    if (target) {
      console.log('--- FOUND ---');
      console.log('source_url:', target.source_url);
      console.log('thumbnail_url:', target.thumbnail_url);
    } else {
      console.log('Article with 1653522 not found in current feed.');
      // Print first few for debugging
      console.log('Found ' + articles.length + ' articles. Sample:');
      articles.slice(0, 3).forEach(a => console.log(a.source_url));
    }
  } catch (err) {
    console.error('Error during scraping:', err);
  }
}

run();