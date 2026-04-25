/**
 * Data normalization helpers
 */

const { cleanText } = require('./text');

const CATEGORY_MAP = {
  'top-stories':   'top-stories',
  'topstories':    'top-stories',
  'home':          'top-stories',
  'latest':        'top-stories',
  'news':          'top-stories',
  'national':      'india',
  'india':         'india',
  'business':      'business',
  'economy':       'business',
  'finance':       'business',
  'market':        'business',
  'tech':          'technology',
  'technology':    'technology',
  'science':       'technology',
  'sport':         'sports',
  'sports':        'sports',
  'cricket':       'sports',
  'health':        'health',
  'wellness':      'health',
  'fitness':       'health',
  'entertainment': 'entertainment',
  'bollywood':     'entertainment',
  'movies':        'entertainment',
  'television':    'entertainment',
  'world':         'world',
  'international': 'world',
};

const normalizeCategory = (slug = 'top-stories') => {
  const key = slug.toLowerCase().replace(/[^a-z-]/g, '').trim();
  return CATEGORY_MAP[key] || 'top-stories';
};

const normalizeTitle = (title = '') =>
  cleanText(title, 500);

const normalizeContent = (content = '') =>
  cleanText(content, 10000);

const normalizeSummary = (summary = '') =>
  cleanText(summary, 1000);

const normalizePublishedAt = (date) => {
  if (!date) return new Date();
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date() : d;
};

const normalizeArticle = (article) => ({
  ...article,
  title:        normalizeTitle(article.title),
  summary:      normalizeSummary(article.summary),
  content:      normalizeContent(article.content),
  category_slug: normalizeCategory(article.category_slug),
  published_at: normalizePublishedAt(article.published_at),
});

module.exports = { normalizeArticle, normalizeCategory };

