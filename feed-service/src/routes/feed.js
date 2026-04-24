const express = require('express');
const { body, query: queryValidator, validationResult } = require('express-validator');
const { query } = require('../db/postgres');
const { buildPersonalizedFeed } = require('../services/ranking');
const { recordInteraction, getTrendingArticles, VALID_ACTIONS } = require('../services/interactions');

const router = express.Router();

const getLatestArticles = async (language = 'en', limit = 50, offset = 0, category = null) => {
  const langs = String(language).split(',').map(l => l.trim()).filter(Boolean);
  const langParams = langs.map((_, i) => `$${i + 1}`).join(', ');

  let whereClause = `a.is_published = TRUE AND a.language IN (${langParams})`;
  let countWhereClause = `a.is_published = TRUE AND a.language IN (${langParams})`;
  let params = [...langs];

  if (category) {
    const paramIndex = params.length + 1;
    whereClause += ` AND c.slug = $${paramIndex}`;
    countWhereClause += ` AND c.slug = $${paramIndex}`;
    params.push(category);
  }

  const articlesResult = await query(
    `SELECT
      a.id, a.title, a.summary, a.content, a.thumbnail_url, a.source_url, a.source_name,
      a.author, a.published_at, a.trending_score,
      a.category_id, a.language,
      COALESCE(a.view_count, 0) as view_count,
      COALESCE(a.like_count, 0) as like_count,
      COALESCE(a.share_count, 0) as share_count,
      COALESCE(a.is_premium, false) as is_premium
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE ${whereClause}
     ORDER BY a.published_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE ${countWhereClause}`,
    params
  );

  return {
    articles: articlesResult.rows,
    total: countResult.rows[0]?.total || 0,
  };
};

/**
 * GET /api/v1/feed
 * Get personalized feed for authenticated user
 * Requires: Authorization header with JWT
 * Query: page, limit, language, languages, category
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, language = 'en', languages, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const userId = req.user?.userId || null;
    // Support ?languages=en,hi,mr (multi) or ?language=en (single, legacy)
    const langParam = languages || language;

    let feed;
    if (userId) {
      feed = await buildPersonalizedFeed(userId, langParam, pageNum, limitNum);
    } else {
      const offset = (pageNum - 1) * limitNum;
      const latest = await getLatestArticles(langParam, limitNum, offset, category);
      feed = {
        articles: latest.articles,
        pagination: { page: pageNum, limit: limitNum, total: latest.total },
      };
    }

    res.status(200).json({ success: true, data: feed });
  } catch (error) {
    console.error('[Feed] Error:', error);
    res.status(500).json({ error: 'Failed to generate feed', code: 'FEED_GENERATION_FAILED' });
  }
});

/**
 * POST /api/v1/interactions
 * Record user interaction with article
 * Body: { articleId, action: "clicked|viewed|bookmarked|shared" }
 */
router.post('/interactions', [
  body('articleId').isUUID().withMessage('Valid articleId required'),
  body('action').isIn(VALID_ACTIONS).withMessage(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { articleId, action } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Login required to record interactions', code: 'MISSING_USER_ID' });
    }

    const interactionId = await recordInteraction(userId, articleId, action, {
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      data: { interactionId, action },
    });
  } catch (error) {
    console.error('[Feed] Interaction error:', error);
    res.status(500).json({
      error: 'Failed to record interaction',
      code: 'INTERACTION_FAILED',
    });
  }
});

/**
 * GET /api/v1/trending
 * Get trending articles globally (no auth required)
 */
router.get('/trending', async (req, res) => {
  try {
    const { language = 'en', limit = 50 } = req.query;

    const trending = await getTrendingArticles(language, Math.min(parseInt(limit), 100));

    res.status(200).json({
      success: true,
      data: {
        articles: trending,
        type: 'global_trending',
      },
    });
  } catch (error) {
    console.error('[Feed] Trending error:', error);
    res.status(500).json({
      error: 'Failed to fetch trending articles',
      code: 'TRENDING_FETCH_FAILED',
    });
  }
});

module.exports = router;
