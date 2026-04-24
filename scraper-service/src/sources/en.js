/**
 * English news sources — RSS feeds + scrape config
 * Format: { name, url, type: 'rss'|'web', language, category, selectors? }
 */
module.exports = [
  // ── Top Stories ──────────────────────────────────────────────────
  { name: 'NDTV',           language: 'en', category: 'top-stories',   type: 'rss', url: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
  { name: 'NDTV India',     language: 'en', category: 'india',         type: 'rss', url: 'https://feeds.feedburner.com/ndtvnews-india-news' },
  { name: 'The Hindu',      language: 'en', category: 'top-stories',   type: 'rss', url: 'https://www.thehindu.com/feeder/default.rss' },
  { name: 'The Hindu',      language: 'en', category: 'india',         type: 'rss', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
  { name: 'Times of India', language: 'en', category: 'top-stories',   type: 'rss', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
  { name: 'Times of India', language: 'en', category: 'india',         type: 'rss', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms' },
  { name: 'India Today',    language: 'en', category: 'top-stories',   type: 'rss', url: 'https://www.indiatoday.in/rss/home' },
  { name: 'India Today',    language: 'en', category: 'india',         type: 'rss', url: 'https://www.indiatoday.in/rss/1206578' },
  { name: 'Hindustan Times',language: 'en', category: 'india',         type: 'rss', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml' },
  { name: 'Hindustan Times',language: 'en', category: 'top-stories',   type: 'rss', url: 'https://www.hindustantimes.com/feeds/rss/top-news/rssfeed.xml' },
  { name: 'The Wire',       language: 'en', category: 'top-stories',   type: 'rss', url: 'https://thewire.in/feed' },
  { name: 'Scroll.in',      language: 'en', category: 'top-stories',   type: 'rss', url: 'https://scroll.in/feed' },
  { name: 'The Print',      language: 'en', category: 'top-stories',   type: 'rss', url: 'https://theprint.in/feed/' },
  { name: 'News18',         language: 'en', category: 'india',         type: 'rss', url: 'https://www.news18.com/rss/india.xml' },
  { name: 'News18',         language: 'en', category: 'top-stories',   type: 'rss', url: 'https://www.news18.com/commonfeeds/v1/eng/rss/home.xml' },
  { name: 'Firstpost',      language: 'en', category: 'india',         type: 'rss', url: 'https://www.firstpost.com/rss/india.xml' },
  { name: 'Firstpost',      language: 'en', category: 'top-stories',   type: 'rss', url: 'https://www.firstpost.com/rss/top-stories.xml' },
  { name: 'WION',           language: 'en', category: 'top-stories',   type: 'rss', url: 'https://www.wionews.com/feeds/india.xml' },
  { name: 'Tribune India',  language: 'en', category: 'india',         type: 'rss', url: 'https://www.tribuneindia.com/rss/feed.xml' },
  { name: 'NDTV',           language: 'en', category: 'world',          type: 'rss', url: 'https://feeds.feedburner.com/ndtvnews-world-news' },
  { name: 'Times of India', language: 'en', category: 'world',          type: 'rss', url: 'https://timesofindia.indiatimes.com/rssfeeds/4719161.cms' },
  { name: 'The Hindu',      language: 'en', category: 'world',          type: 'rss', url: 'https://www.thehindu.com/news/international/feeder/default.rss' },
  { name: 'Indian Express', language: 'en', category: 'top-stories',    type: 'rss', url: 'https://indianexpress.com/feed/' },
  { name: 'Indian Express', language: 'en', category: 'india',          type: 'rss', url: 'https://indianexpress.com/section/india/feed/' },
  { name: 'Indian Express', language: 'en', category: 'world',          type: 'rss', url: 'https://indianexpress.com/section/world/feed/' },
  // ── Business ─────────────────────────────────────────────────────
  { name: 'Economic Times', language: 'en', category: 'business',      type: 'rss', url: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms' },
  { name: 'Business Standard',language:'en',category: 'business',      type: 'rss', url: 'https://www.business-standard.com/rss/home_page_top_stories.rss' },
  { name: 'Mint',           language: 'en', category: 'business',      type: 'rss', url: 'https://www.livemint.com/rss/news' },
  { name: 'Financial Express',language:'en',category: 'business',      type: 'rss', url: 'https://www.financialexpress.com/feed/' },
  { name: 'MoneyControl',   language: 'en', category: 'business',      type: 'rss', url: 'https://www.moneycontrol.com/rss/latestnews.xml' },
  { name: 'Indian Express', language: 'en', category: 'business',      type: 'rss', url: 'https://indianexpress.com/section/business/feed/' },
  { name: 'The Hindu',      language: 'en', category: 'business',      type: 'rss', url: 'https://www.thehindu.com/business/feeder/default.rss' },
  // ── Technology ───────────────────────────────────────────────────
  { name: 'NDTV Gadgets',   language: 'en', category: 'technology',    type: 'rss', url: 'https://feeds.feedburner.com/gadgets360-latest' },
  { name: '91Mobiles',      language: 'en', category: 'technology',    type: 'rss', url: 'https://www.91mobiles.com/hub/feed/' },
  { name: 'The Hindu Tech', language: 'en', category: 'technology',    type: 'rss', url: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss' },
  { name: 'The Hindu',      language: 'en', category: 'technology',    type: 'rss', url: 'https://www.thehindu.com/sci-tech/feeder/default.rss' },
  { name: 'Indian Express', language: 'en', category: 'technology',    type: 'rss', url: 'https://indianexpress.com/section/technology/feed/' },
  // ── Sports ───────────────────────────────────────────────────────
  { name: 'NDTV Sports',    language: 'en', category: 'sports',        type: 'rss', url: 'https://feeds.feedburner.com/ndtvnews-sports' },
  { name: 'CricBuzz',       language: 'en', category: 'sports',        type: 'rss', url: 'https://www.cricbuzz.com/rss-feeds/recent-stories-rss' },
  { name: 'ESPN Cricinfo',  language: 'en', category: 'sports',        type: 'rss', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml' },
  { name: 'The Hindu',      language: 'en', category: 'sports',        type: 'rss', url: 'https://www.thehindu.com/sport/feeder/default.rss' },
  { name: 'Indian Express', language: 'en', category: 'sports',        type: 'rss', url: 'https://indianexpress.com/section/sports/feed/' },
  // ── Health ───────────────────────────────────────────────────────
  { name: 'NDTV Health',    language: 'en', category: 'health',        type: 'rss', url: 'https://feeds.feedburner.com/ndtvnews-health-and-fitness' },
  { name: 'The Hindu',      language: 'en', category: 'health',        type: 'rss', url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss' },
  // ── Entertainment ────────────────────────────────────────────────
  { name: 'Bollywood Hungama',language:'en',category:'entertainment',  type: 'rss', url: 'https://www.bollywoodhungama.com/rss/news/' },
  { name: 'Pinkvilla',      language: 'en', category: 'entertainment', type: 'rss', url: 'https://www.pinkvilla.com/rss.xml' },
  { name: 'FilmiBeat',      language: 'en', category: 'entertainment', type: 'rss', url: 'https://www.filmibeat.com/rss/' },
  { name: 'The Hindu',      language: 'en', category: 'entertainment', type: 'rss', url: 'https://www.thehindu.com/entertainment/feeder/default.rss' },
  { name: 'Indian Express', language: 'en', category: 'entertainment', type: 'rss', url: 'https://indianexpress.com/section/entertainment/feed/' },
];

