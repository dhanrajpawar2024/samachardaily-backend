const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/postgres');
const { invalidateFeedCache } = require('./ranking');

/**
 * Valid interaction actions
 */
const VALID_ACTIONS = ['view', 'like', 'share', 'bookmark', 'skip', 'unlike'];

/**
 * Record user interaction with article
 */
const recordInteraction = async (userId, articleId, action, metadata = {}) => {
  if (!VALID_ACTIONS.includes(action)) {
    throw new Error(`Invalid action: ${action}`);
  }

  try {
    const interactionId = uuidv4();

    // Store in database
    await query(
      `INSERT INTO user_article_interactions (id, user_id, article_id, action, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
      [interactionId, userId, articleId, action, JSON.stringify(metadata)]
    );

    // Update article's trending_score if engagement
    if (['bookmark', 'share', 'like'].includes(action)) {
      const scoreBoost = {
        bookmark: 5,
        share: 10,
        like: 3,
      };

      await query(
        'UPDATE articles SET trending_score = trending_score + $1 WHERE id = $2',
        [scoreBoost[action], articleId]
      );
    }

    console.log(`[Interactions] Recorded ${action} for user ${userId} on article ${articleId}`);

    // Invalidate user's feed cache (will trigger new ranking calculation)
    await invalidateFeedCache(userId);

    return interactionId;
  } catch (error) {
    console.error('[Interactions] Error recording interaction:', error);
    throw error;
  }
};

/**
 * Get user's recent interactions
 */
const getUserInteractions = async (userId, limit = 100) => {
  try {
    const interactions = await query(
      `SELECT id, article_id, action, timestamp
       FROM user_article_interactions
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [userId, limit]
    );

    return interactions.rows;
  } catch (error) {
    console.error('[Interactions] Error getting interactions:', error);
    throw error;
  }
};

/**
 * Get trending articles (what's popular across all users)
 * @param {string} language - single or comma-separated e.g. "en,hi,mr"
 */
const getTrendingArticles = async (language = 'en', limit = 50) => {
  try {
    const langs = String(language).split(',').map(l => l.trim()).filter(Boolean);
    const langParams = langs.map((_, i) => `$${i + 1}`).join(', ');
    const trending = await query(
      `SELECT 
        a.id, a.title, a.summary, a.content, a.thumbnail_url, a.source_url, a.source_name,
        a.author, a.published_at, a.trending_score,
        a.category_id, a.language,
        COALESCE(a.view_count, 0) as view_count,
        COALESCE(a.like_count, 0) as like_count,
        COALESCE(a.share_count, 0) as share_count,
        COALESCE(a.is_premium, false) as is_premium,
        COUNT(DISTINCT uai.user_id) as interaction_count
       FROM articles a
       LEFT JOIN user_article_interactions uai ON a.id = uai.article_id
       WHERE a.is_published = TRUE AND a.language IN (${langParams})
       GROUP BY a.id
       ORDER BY a.trending_score DESC, interaction_count DESC
       LIMIT $${langs.length + 1}`,
      [...langs, limit]
    );

    return trending.rows;
  } catch (error) {
    console.error('[Interactions] Error getting trending articles:', error);
    throw error;
  }
};

module.exports = {
  VALID_ACTIONS,
  recordInteraction,
  getUserInteractions,
  getTrendingArticles,
};
