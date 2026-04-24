/**
 * YouTube RSS Scraper
 * Fetches the public RSS feed for a YouTube channel and extracts video metadata.
 * No API key required — uses YouTube's public Atom feeds.
 */

const Parser = require('rss-parser');
const logger = require('../utils/logger');

const ytParser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'SamacharDaily-Scraper/1.0' },
  customFields: {
    item: [
      ['yt:videoId',  'videoId'],
      ['yt:channelId','channelId'],
      ['media:group', 'mediaGroup'],
    ],
  },
});

/**
 * Scrape all recent videos from a YouTube channel via its public RSS feed.
 * @param {{ name: string, channelId: string, language: string, category: string }} source
 * @returns {Promise<Array>} Array of raw video objects ready for DB insertion
 */
async function scrapeYouTubeChannel(source) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`;

  const feed = await ytParser.parseURL(feedUrl);

  return feed.items
    .filter(item => item.videoId) // skip malformed entries
    .map(item => {
      const videoId = item.videoId;
      return {
        title:         item.title || 'Untitled',
        description:   item.contentSnippet || null,
        video_url:     `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        author_name:   source.name,
        language:      source.language,
        category_slug: source.category,
        published_at:  item.pubDate ? new Date(item.pubDate) : new Date(),
        duration_ms:   0, // YouTube RSS doesn't include duration
      };
    });
}

module.exports = { scrapeYouTubeChannel };
