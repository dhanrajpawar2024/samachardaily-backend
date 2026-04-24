const Parser = require('rss-parser');
const parser = new Parser();
const urls = [
  'https://feeds.feedburner.com/ndtvnews-top-stories',
  'https://feeds.feedburner.com/ndtvnews-india-news',
  'https://feeds.feedburner.com/ndtvkhabar-latest',
  'https://feeds.feedburner.com/ndtvkhabar-india',
  'https://www.lokmat.com/rss/topstories.xml',
  'https://www.lokmat.com/rss/maharashtra.xml',
  'https://marathi.abplive.com/home/feed',
  'https://www.aajtak.in/rssfeeds/?id=home',
  'https://www.aajtak.in/rssfeeds/?id=india',
  'https://www.jagran.com/rss/news/national.xml',
  'https://www.tv9hindi.com/rss',
  'https://www.tv9marathi.com/rss'
];
(async () => {
  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);
      console.log(`OK ${url} items=${(feed.items || []).length} title=${feed.title || ''}`);
    } catch (e) {
      console.log(`FAIL ${url} -> ${e.message}`);
    }
  }
})();
