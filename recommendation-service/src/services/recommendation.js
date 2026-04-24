const redis = require('../db/redis');

/**
 * User-to-user collaborative filtering
 * Finds users with similar interaction patterns
 */
const findSimilarUsers = async (userId, limit, db) => {
  try {
    // Get articles the target user interacted with
    const userArticles = await db.getAll(
      `SELECT article_id, interaction_type 
       FROM user_article_interactions 
       WHERE user_id = $1 
       AND interaction_type IN ('like', 'bookmark')
       LIMIT 100`,
      [userId]
    );

    if (userArticles.length === 0) {
      return [];
    }

    const articleIds = userArticles.map((a) => a.article_id);

    // Find other users who interacted with same articles
    const similarUsers = await db.getAll(
      `SELECT DISTINCT user_id, COUNT(*) as common_interactions
       FROM user_article_interactions
       WHERE article_id = ANY($1)
       AND user_id != $2
       GROUP BY user_id
       ORDER BY common_interactions DESC
       LIMIT $3`,
      [articleIds, userId, limit]
    );

    return similarUsers;
  } catch (error) {
    console.error('[Recommendation Service] Error finding similar users:', error);
    return [];
  }
};

/**
 * Item-to-item collaborative filtering
 * Finds articles frequently liked together
 */
const findRelatedArticles = async (articleId, limit, db, redisDb) => {
  const cacheKey = `related_articles:${articleId}`;

  // Check cache first
  const cached = await redisDb.get(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  try {
    // Find users who liked this article
    const userIds = await db.getAll(
      `SELECT DISTINCT user_id 
       FROM user_article_interactions 
       WHERE article_id = $1 
       AND interaction_type IN ('like', 'bookmark')
       LIMIT 500`,
      [articleId]
    );

    if (userIds.length === 0) {
      return [];
    }

    const userIdList = userIds.map((u) => u.user_id);

    // Find other articles these users also liked
    const relatedArticles = await db.getAll(
      `SELECT article_id, COUNT(*) as co_occurrence
       FROM user_article_interactions
       WHERE user_id = ANY($1)
       AND article_id != $2
       AND interaction_type IN ('like', 'bookmark')
       GROUP BY article_id
       ORDER BY co_occurrence DESC
       LIMIT $3`,
      [userIdList, articleId, limit]
    );

    // Cache for 2 hours
    await redisDb.set(cacheKey, relatedArticles, 7200);

    return relatedArticles;
  } catch (error) {
    console.error('[Recommendation Service] Error finding related articles:', error);
    return [];
  }
};

/**
 * Content-based filtering
 * Recommends articles from categories user has engaged with
 */
const getContentBasedRecommendations = async (userId, limit, db, redisDb) => {
  const cacheKey = `content_based:${userId}`;

  // Check cache first
  const cached = await redisDb.get(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  try {
    // Get categories user has engaged with
    const userCategories = await db.getAll(
      `SELECT DISTINCT c.id, COUNT(i.id) as engagement_count
       FROM user_article_interactions i
       JOIN articles a ON i.article_id = a.id
       JOIN categories c ON a.category_id = c.id
       WHERE i.user_id = $1
       AND i.interaction_type IN ('like', 'bookmark', 'view')
       GROUP BY c.id
       ORDER BY engagement_count DESC
       LIMIT 5`,
      [userId]
    );

    if (userCategories.length === 0) {
      return [];
    }

    const categoryIds = userCategories.map((c) => c.id);

    // Get recent articles from these categories
    const recommendations = await db.getAll(
      `SELECT a.id, a.title, c.name as category, 
              COUNT(DISTINCT i.user_id) as popularity
       FROM articles a
       JOIN categories c ON a.category_id = c.id
       LEFT JOIN user_article_interactions i ON a.id = i.article_id
       WHERE c.id = ANY($1)
       AND a.published_at > NOW() - INTERVAL '7 days'
       AND a.id NOT IN (
         SELECT article_id FROM user_article_interactions WHERE user_id = $2
       )
       GROUP BY a.id, a.title, c.name
       ORDER BY popularity DESC, a.published_at DESC
       LIMIT $3`,
      [categoryIds, userId, limit]
    );

    // Cache for 1 hour
    await redisDb.set(cacheKey, recommendations, 3600);

    return recommendations;
  } catch (error) {
    console.error('[Recommendation Service] Error getting content-based recommendations:', error);
    return [];
  }
};

/**
 * Collaborative filtering
 * Combines user-to-user and item-to-item CF
 */
const getCollaborativeRecommendations = async (userId, limit, db, redisDb) => {
  const cacheKey = `collaborative:${userId}`;

  // Check cache first
  const cached = await redisDb.get(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  try {
    // Get similar users
    const similarUsers = await findSimilarUsers(userId, 20, db);

    if (similarUsers.length === 0) {
      return [];
    }

    const similarUserIds = similarUsers.map((u) => u.user_id);

    // Get articles liked by similar users that target user hasn't interacted with
    const recommendations = await db.getAll(
      `SELECT a.id, a.title, COUNT(i.user_id) as score
       FROM articles a
       JOIN user_article_interactions i ON a.id = i.article_id
       WHERE i.user_id = ANY($1)
       AND i.interaction_type IN ('like', 'bookmark')
       AND a.id NOT IN (
         SELECT article_id FROM user_article_interactions WHERE user_id = $2
       )
       GROUP BY a.id, a.title
       ORDER BY score DESC
       LIMIT $3`,
      [similarUserIds, userId, limit * 2]
    );

    // Cache for 2 hours
    await redisDb.set(cacheKey, recommendations, 7200);

    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('[Recommendation Service] Error getting collaborative recommendations:', error);
    return [];
  }
};

/**
 * Handle cold-start for new users
 * Recommend popular articles in system
 */
const getColdStartRecommendations = async (limit, db, redisDb) => {
  const cacheKey = 'cold_start_recommendations';

  // Check cache first (1 hour)
  const cached = await redisDb.get(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  try {
    const recommendations = await db.getAll(
      `SELECT a.id, a.title, c.name as category,
              COUNT(DISTINCT i.user_id) as popularity,
              AVG(CASE WHEN i.interaction_type = 'like' THEN 1 ELSE 0 END) as engagement_rate
       FROM articles a
       JOIN categories c ON a.category_id = c.id
       LEFT JOIN user_article_interactions i ON a.id = i.article_id
       WHERE a.published_at > NOW() - INTERVAL '30 days'
       GROUP BY a.id, a.title, c.name
       HAVING COUNT(DISTINCT i.user_id) > 5
       ORDER BY popularity DESC, engagement_rate DESC
       LIMIT $1`,
      [limit * 2]
    );

    // Cache for 1 hour
    await redisDb.set(cacheKey, recommendations, 3600);

    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('[Recommendation Service] Error getting cold-start recommendations:', error);
    return [];
  }
};

/**
 * Personalized recommendations
 * Combines multiple algorithms with weights
 */
const getPersonalizedRecommendations = async (userId, limit, db, redisDb) => {
  try {
    // Check if user has interaction history
    const userInteractions = await db.getOne(
      'SELECT COUNT(*) as count FROM user_article_interactions WHERE user_id = $1',
      [userId]
    );

    // Cold start: new user with no history
    if (userInteractions.count < 5) {
      return getColdStartRecommendations(limit, db, redisDb);
    }

    // Get recommendations from multiple sources
    const [contentBased, collaborative] = await Promise.all([
      getContentBasedRecommendations(userId, limit, db, redisDb),
      getCollaborativeRecommendations(userId, limit, db, redisDb),
    ]);

    // Combine and deduplicate
    const seen = new Set();
    const combined = [];

    // Weight: 60% collaborative, 40% content-based
    const collab = collaborative.map((a) => ({ ...a, source: 'collaborative', weight: 0.6 }));
    const content = contentBased.map((a) => ({ ...a, source: 'content', weight: 0.4 }));

    for (const rec of [...collab, ...content]) {
      if (!seen.has(rec.id)) {
        combined.push(rec);
        seen.add(rec.id);
      }
    }

    return combined.slice(0, limit);
  } catch (error) {
    console.error('[Recommendation Service] Error getting personalized recommendations:', error);
    // Fallback to cold-start
    return getColdStartRecommendations(limit, db, redisDb);
  }
};

module.exports = {
  findSimilarUsers,
  findRelatedArticles,
  getContentBasedRecommendations,
  getCollaborativeRecommendations,
  getColdStartRecommendations,
  getPersonalizedRecommendations,
};

