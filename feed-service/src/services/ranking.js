const axios = require('axios');
const { getAll, getOne } = require('../db/postgres');
const { set: redisSet, get: redisGet } = require('../db/redis');

/**
 * Get user's category affinity (what categories they prefer)
 * Based on their interaction history
 */
const getUserAffinity = async (userId) => {
  // Check Redis cache first
  const cached = await redisGet(`affinity:${userId}`);
  if (cached) return cached;

  // Calculate from database
  const result = await getAll(
    `SELECT 
      c.id, 
      c.name,
      COUNT(*) as interaction_count,
      AVG(CASE 
        WHEN action = 'view' THEN 1
        WHEN action = 'bookmark' THEN 2
        WHEN action = 'share' THEN 2.5
        WHEN action = 'like' THEN 1.5
        ELSE 0
      END) as avg_engagement
     FROM user_article_interactions uai
     JOIN articles a ON uai.article_id = a.id
     JOIN categories c ON a.category_id = c.id
     WHERE uai.user_id = $1 AND uai.timestamp > NOW() - INTERVAL '30 days'
     GROUP BY c.id, c.name
     ORDER BY avg_engagement DESC`,
    [userId]
  );

  // Normalize to 0-1 scale
  const affinity = {};
  const maxInteractions = Math.max(...result.map(r => r.avg_engagement), 1);
  
  result.forEach(row => {
    affinity[row.id] = row.avg_engagement / maxInteractions;
  });

  // Cache for 1 hour
  await redisSet(`affinity:${userId}`, affinity, 3600);
  
  return affinity;
};

/**
 * Calculate ranking score for an article
 * Combines: recency, trending, affinity, engagement
 */
const calculateArticleScore = (article, userAffinity) => {
  const now = Date.now();
  const publishedTime = new Date(article.published_at).getTime();
  const ageMinutes = (now - publishedTime) / (1000 * 60);
  const ageDays = ageMinutes / (60 * 24);

  // Recency score (decay exponentially, half-life of 7 days)
  const recencyScore = Math.exp(-0.693 * ageDays / 7);

  // Trending score (0-100 normalized to 0-1)
  const trendingScore = Math.min(article.trending_score / 100, 1);

  // Affinity score (user preference for this category)
  const categoryAffinity = userAffinity[article.category_id] || 0;

  // Engagement score (bookmarks + shares normalized)
  const engagementScore = Math.min(
    (article.bookmark_count || 0 + article.share_count || 0) / 100,
    1
  );

  // Weighted combination
  const finalScore =
    (parseFloat(process.env.RECENCY_WEIGHT) || 0.2) * recencyScore +
    (parseFloat(process.env.TRENDING_WEIGHT) || 0.3) * trendingScore +
    (parseFloat(process.env.AFFINITY_WEIGHT) || 0.4) * categoryAffinity +
    (parseFloat(process.env.ENGAGEMENT_WEIGHT) || 0.1) * engagementScore;

  return finalScore;
};

/**
 * Build personalized feed for user
 * @param {string} userId
 * @param {string|string[]} language - single language code or comma-separated list e.g. "en,hi,mr"
 */
const buildPersonalizedFeed = async (userId, language = 'en', page = 1, limit = 50) => {
  // Support comma-separated multi-language e.g. "en,hi,mr"
  const langs = Array.isArray(language)
    ? language
    : String(language).split(',').map(l => l.trim()).filter(Boolean);

  const cacheKey = `feed:${userId}:${langs.join('_')}:${page}:${limit}`;

  const cached = await redisGet(cacheKey);
  if (cached) {
    console.log(`[Feed] Cache hit for user ${userId}`);
    return cached;
  }

  try {
    const affinity = await getUserAffinity(userId);

    // Build parameterized language filter
    const langParams = langs.map((_, i) => `$${i + 1}`).join(', ');
    const articles = await getAll(
      `SELECT 
        a.id, a.title, a.summary, a.content, a.thumbnail_url, a.source_url, a.source_name,
        a.author, a.published_at, a.trending_score,
        a.category_id, a.language,
        COALESCE(a.view_count, 0) as view_count,
        COALESCE(a.like_count, 0) as like_count,
        COALESCE(a.share_count, 0) as share_count,
        COALESCE(a.is_premium, false) as is_premium,
        COALESCE(COUNT(DISTINCT bm.user_id), 0) as bookmark_count,
        COALESCE(COUNT(DISTINCT sh.id), 0) as share_interaction_count
       FROM articles a
       LEFT JOIN bookmarks bm ON a.id = bm.article_id
       LEFT JOIN user_article_interactions sh ON a.id = sh.article_id AND sh.action = 'share'
       WHERE a.is_published = TRUE AND a.language IN (${langParams})
       GROUP BY a.id
       ORDER BY a.published_at DESC
       LIMIT 500`,
      langs
    );

    // Score and rank articles
    const scoredArticles = articles
      .map(article => ({
        ...article,
        score: calculateArticleScore(article, affinity),
        categoryAffinity: affinity[article.category_id] || 0,
      }))
      .filter(article => article.score > 0.01) // Filter low scores
      .sort((a, b) => b.score - a.score);

    // Paginate
    const offset = (page - 1) * limit;
    const paginatedArticles = scoredArticles.slice(offset, offset + limit);

    // Remove score from response
    const feed = paginatedArticles.map(({ score, categoryAffinity, ...article }) => article);

    const result = {
      articles: feed,
      pagination: {
        page,
        limit,
        total: scoredArticles.length,
      },
      ranking_info: {
        user_affinity: affinity,
        weights: {
          recency: parseFloat(process.env.RECENCY_WEIGHT) || 0.2,
          trending: parseFloat(process.env.TRENDING_WEIGHT) || 0.3,
          affinity: parseFloat(process.env.AFFINITY_WEIGHT) || 0.4,
          engagement: parseFloat(process.env.ENGAGEMENT_WEIGHT) || 0.1,
        },
      },
    };

    // Cache for 5 minutes
    const cacheTTL = (parseInt(process.env.FEED_CACHE_TTL_MINUTES) || 5) * 60;
    await redisSet(cacheKey, result, cacheTTL);

    return result;
  } catch (error) {
    console.error('[Feed] Error building feed:', error);
    throw error;
  }
};

/**
 * Invalidate user's feed cache (called after interaction)
 */
const invalidateFeedCache = async (userId) => {
  console.log(`[Feed] Invalidating cache for user ${userId}`);
  // In production, you'd use Redis SCAN to find all feed:userId:* keys
  // For now, we'll let them expire naturally (5 minutes)
  // Or manually delete specific pages
  const pattern = `feed:${userId}:*`;
  // TODO: Implement pattern-based deletion
};

module.exports = {
  getUserAffinity,
  calculateArticleScore,
  buildPersonalizedFeed,
  invalidateFeedCache,
};
