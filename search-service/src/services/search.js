const { get: redisGet, set: redisSet } = require('../db/redis');
const elasticsearch = require('../db/elasticsearch');
const { getAll } = require('../db/postgres');

/**
 * Search articles with full-text search and filtering
 */
const searchArticles = async (
  query,
  language = 'en',
  page = 1,
  limit = 20,
  filters = {}
) => {
  const cacheKey = `search:${query}:${language}:${page}:${limit}:${JSON.stringify(filters)}`;
  
  // Check Redis cache
  const cached = await redisGet(cacheKey);
  if (cached) {
    console.log(`[Search] Cache hit for query: ${query}`);
    return cached;
  }

  try {
    // Build Elasticsearch filters
    const esFilters = {
      language,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sort_by: filters.sort_by || 'published_at',
      sort_order: filters.sort_order || 'desc',
    };

    if (filters.category_id) {
      esFilters.category_id = filters.category_id;
    }
    if (filters.author) {
      esFilters.author = filters.author;
    }
    if (filters.source) {
      esFilters.source = filters.source;
    }
    if (filters.date_from || filters.date_to) {
      esFilters.date_from = filters.date_from;
      esFilters.date_to = filters.date_to;
    }

    // Search Elasticsearch
    const results = await elasticsearch.search(query, esFilters);

    const response = {
      query,
      total: results.total,
      articles: results.articles,
      pagination: {
        page: esFilters.page,
        limit: esFilters.limit,
        total_pages: Math.ceil(results.total / esFilters.limit),
      },
      filters: esFilters,
    };

    // Cache for 5 minutes
    const cacheTTL = (parseInt(process.env.SEARCH_CACHE_TTL_MINUTES) || 5) * 60;
    await redisSet(cacheKey, response, cacheTTL);

    return response;
  } catch (error) {
    console.error('[Search] Error:', error);
    throw error;
  }
};

/**
 * Get search suggestions / autocomplete
 */
const getSearchSuggestions = async (query, language = 'en', limit = 10) => {
  const cacheKey = `suggestions:${query}:${language}`;
  
  const cached = await redisGet(cacheKey);
  if (cached) return cached;

  try {
    // Search with autocomplete analyzer
    const results = await elasticsearch.search(query, {
      language,
      limit: limit * 2, // Get more to filter duplicates
      sort_by: 'published_at',
      sort_order: 'desc',
    });

    // Extract unique titles for suggestions
    const suggestions = Array.from(
      new Set(results.articles.map((a) => a.title))
    ).slice(0, limit);

    const response = {
      query,
      suggestions,
      count: suggestions.length,
    };

    // Cache for 1 hour
    await redisSet(cacheKey, response, 3600);

    return response;
  } catch (error) {
    console.error('[Search] Suggestions error:', error);
    throw error;
  }
};

/**
 * Get trending topics/keywords
 */
const getTrendingKeywords = async (language = 'en', limit = 20) => {
  const cacheKey = `trending_keywords:${language}`;
  
  const cached = await redisGet(cacheKey);
  if (cached) return cached;

  try {
    // Query database for trending articles
    const trendingArticles = await getAll(
      `SELECT DISTINCT title, trending_score, category_name
       FROM articles
       WHERE is_published = TRUE AND language = $1
       ORDER BY trending_score DESC, published_at DESC
       LIMIT $2`,
      [language, limit]
    );

    const response = {
      language,
      keywords: trendingArticles.map((a) => ({
        title: a.title,
        score: a.trending_score,
        category: a.category_name,
      })),
      count: trendingArticles.length,
    };

    // Cache for 1 hour
    await redisSet(cacheKey, response, 3600);

    return response;
  } catch (error) {
    console.error('[Search] Trending keywords error:', error);
    throw error;
  }
};

/**
 * Get search filters options (categories, authors, sources)
 */
const getFilterOptions = async (language = 'en') => {
  const cacheKey = `filter_options:${language}`;
  
  const cached = await redisGet(cacheKey);
  if (cached) return cached;

  try {
    // Get unique categories, authors, sources from database
    const categories = await getAll(
      `SELECT DISTINCT category_id, category_name, COUNT(*) as count
       FROM articles
       WHERE is_published = TRUE AND language = $1
       GROUP BY category_id, category_name
       ORDER BY count DESC`,
      [language]
    );

    const authors = await getAll(
      `SELECT DISTINCT author, COUNT(*) as count
       FROM articles
       WHERE is_published = TRUE AND language = $1 AND author IS NOT NULL
       GROUP BY author
       ORDER BY count DESC
       LIMIT 50`,
      [language]
    );

    const sources = await getAll(
      `SELECT DISTINCT source, COUNT(*) as count
       FROM articles
       WHERE is_published = TRUE AND language = $1
       GROUP BY source
       ORDER BY count DESC`,
      [language]
    );

    const response = {
      language,
      categories: categories.map((c) => ({
        id: c.category_id,
        name: c.category_name,
        count: c.count,
      })),
      authors: authors.map((a) => ({
        name: a.author,
        count: a.count,
      })),
      sources: sources.map((s) => ({
        name: s.source,
        count: s.count,
      })),
    };

    // Cache for 1 hour
    await redisSet(cacheKey, response, 3600);

    return response;
  } catch (error) {
    console.error('[Search] Filter options error:', error);
    throw error;
  }
};

/**
 * Bulk index all articles (initial setup or reindexing)
 */
const reindexAllArticles = async (language = null) => {
  try {
    console.log('[Search] Starting reindex...');

    // Recreate index
    await elasticsearch.deleteIndex();
    await elasticsearch.createIndex();

    // Fetch all articles
    const query = language
      ? `SELECT * FROM articles WHERE is_published = TRUE AND language = $1 ORDER BY published_at DESC`
      : `SELECT * FROM articles WHERE is_published = TRUE ORDER BY published_at DESC`;

    const params = language ? [language] : [];
    const articles = await getAll(query, params);

    console.log(`[Search] Found ${articles.length} articles to index`);

    // Bulk index
    if (articles.length > 0) {
      const result = await elasticsearch.bulkIndex(articles);
      console.log(`[Search] Reindex complete. Errors: ${result.errors}`);
    }

    // Get index stats
    const stats = await elasticsearch.getIndexStats();
    console.log('[Search] Index stats:', stats);

    return stats;
  } catch (error) {
    console.error('[Search] Reindex error:', error);
    throw error;
  }
};

module.exports = {
  searchArticles,
  getSearchSuggestions,
  getTrendingKeywords,
  getFilterOptions,
  reindexAllArticles,
};
