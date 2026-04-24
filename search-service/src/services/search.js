const { get: redisGet, set: redisSet } = require('../db/redis');
const elasticsearch = require('../db/elasticsearch');
const { getAll } = require('../db/postgres');

const normalizeSort = (sortBy = 'published_at', sortOrder = 'desc') => {
  const allowedSort = new Set(['published_at', 'trending_score']);
  const safeSortBy = allowedSort.has(sortBy) ? sortBy : 'published_at';
  const safeSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return { safeSortBy, safeSortOrder };
};

const searchArticlesViaPostgres = async (query, language, page, limit, filters) => {
  const pageNum = parseInt(page) || 1;
  const pageLimit = Math.min(parseInt(limit) || 20, 100);
  const offset = (pageNum - 1) * pageLimit;
  const { safeSortBy, safeSortOrder } = normalizeSort(filters.sort_by, filters.sort_order);

  const where = [
    'a.is_published = TRUE',
    'a.language = $1',
    '(a.title ILIKE $2 OR COALESCE(a.summary, \'\') ILIKE $2 OR COALESCE(a.content, \'\') ILIKE $2)',
  ];
  const params = [language, `%${query}%`];

  if (filters.category_id) {
    params.push(filters.category_id);
    where.push(`a.category_id = $${params.length}`);
  }
  if (filters.author) {
    params.push(filters.author);
    where.push(`a.author = $${params.length}`);
  }
  if (filters.source) {
    params.push(filters.source);
    where.push(`a.source_name = $${params.length}`);
  }
  if (filters.date_from) {
    params.push(filters.date_from);
    where.push(`a.published_at >= $${params.length}`);
  }
  if (filters.date_to) {
    params.push(filters.date_to);
    where.push(`a.published_at <= $${params.length}`);
  }

  const whereSql = where.join(' AND ');

  const countRows = await getAll(
    `SELECT COUNT(*)::int AS total
     FROM articles a
     WHERE ${whereSql}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const listParams = [...params, pageLimit, offset];
  const articles = await getAll(
    `SELECT
       a.id,
       a.title,
       a.summary,
       a.content,
       a.author,
       a.source_url,
       a.source_name,
       a.category_id,
       COALESCE(c.name, '') AS category_name,
       a.language,
       a.thumbnail_url,
       a.published_at,
       a.view_count,
       a.like_count,
       a.share_count,
       a.trending_score,
       a.is_premium
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     WHERE ${whereSql}
     ORDER BY a.${safeSortBy} ${safeSortOrder}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    listParams
  );

  return {
    query,
    total,
    articles,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total_pages: Math.max(1, Math.ceil(total / pageLimit)),
    },
    filters: {
      language,
      sort_by: safeSortBy,
      sort_order: safeSortOrder.toLowerCase(),
      ...(filters.category_id && { category_id: filters.category_id }),
      ...(filters.author && { author: filters.author }),
      ...(filters.source && { source: filters.source }),
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to }),
    },
  };
};

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

    let response;
    try {
      // Search Elasticsearch
      const results = await elasticsearch.search(query, esFilters);
      response = {
        query,
        total: results.total,
        articles: results.articles,
        pagination: {
          page: esFilters.page,
          limit: esFilters.limit,
          total_pages: Math.max(1, Math.ceil(results.total / esFilters.limit)),
        },
        filters: esFilters,
      };
    } catch (esError) {
      console.warn('[Search] Elasticsearch unavailable, using PostgreSQL fallback:', esError.message);
      response = await searchArticlesViaPostgres(query, language, page, limit, filters);
    }

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
    let suggestions;
    try {
      // Search with autocomplete analyzer
      const results = await elasticsearch.search(query, {
        language,
        limit: limit * 2,
        sort_by: 'published_at',
        sort_order: 'desc',
      });

      suggestions = Array.from(
        new Set(results.articles.map((a) => a.title))
      ).slice(0, limit);
    } catch (esError) {
      console.warn('[Search] Suggestions fallback to PostgreSQL:', esError.message);
      const rows = await getAll(
        `SELECT DISTINCT a.title
         FROM articles a
         WHERE a.is_published = TRUE
           AND a.language = $1
           AND a.title ILIKE $2
         ORDER BY a.title ASC
         LIMIT $3`,
        [language, `%${query}%`, limit]
      );
      suggestions = rows.map((r) => r.title);
    }

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
      `SELECT DISTINCT a.title, a.trending_score, c.name AS category_name
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.is_published = TRUE AND a.language = $1
       ORDER BY a.trending_score DESC, a.published_at DESC
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
      `SELECT DISTINCT source_name, COUNT(*) as count
       FROM articles
       WHERE is_published = TRUE AND language = $1
       GROUP BY source_name
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
        name: s.source_name,
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
