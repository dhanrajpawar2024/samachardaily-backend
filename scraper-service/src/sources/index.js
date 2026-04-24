/**
 * Central source registry — aggregates all language source files.
 * Each source entry:
 *   {
 *     name: string,          // Publisher display name
 *     language: string,      // ISO 639-1 code: en, hi, te, ta, kn, mr, bn, gu, pa, ml
 *     category: string,      // Slug: top-stories, india, business, technology, sports, health, entertainment
 *     type: 'rss' | 'web',   // Scrape method
 *     url: string,           // RSS feed URL or article-list page URL
 *     selectors?: {          // Only for type='web'
 *       articleList: string, // CSS selector for article links
 *       title: string,
 *       content: string,
 *       image?: string,
 *       author?: string,
 *       publishedAt?: string,
 *     }
 *   }
 */

const en = require('./en');
const hi = require('./hi');
const te = require('./te');
const ta = require('./ta');
const kn = require('./kn');
const mr = require('./mr');
const bn = require('./bn');
const gu = require('./gu');
const pa = require('./pa');
const ml = require('./ml');

const ALL_SOURCES = [
  ...en,
  ...hi,
  ...te,
  ...ta,
  ...kn,
  ...mr,
  ...bn,
  ...gu,
  ...pa,
  ...ml,
];

/**
 * Get sources filtered by language code(s)
 * @param {string|string[]} languages
 */
const getSourcesByLanguage = (languages) => {
  const langs = Array.isArray(languages) ? languages : [languages];
  return ALL_SOURCES.filter(s => langs.includes(s.language));
};

/**
 * Get sources filtered by category slug
 * @param {string} category
 */
const getSourcesByCategory = (category) =>
  ALL_SOURCES.filter(s => s.category === category);

/**
 * Get all unique languages in the registry
 */
const getSupportedLanguages = () =>
  [...new Set(ALL_SOURCES.map(s => s.language))];

/**
 * Get all unique categories in the registry
 */
const getSupportedCategories = () =>
  [...new Set(ALL_SOURCES.map(s => s.category))];

module.exports = {
  ALL_SOURCES,
  getSourcesByLanguage,
  getSourcesByCategory,
  getSupportedLanguages,
  getSupportedCategories,
};

