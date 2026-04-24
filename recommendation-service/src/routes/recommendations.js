const express = require('express');
const { validationResult } = require('express-validator');
const recommendation = require('../services/recommendation');
const embeddings = require('../services/embeddings');
const postgresDb = require('../db/postgres');
const redisDb = require('../db/redis');

const router = express.Router();

/**
 * GET /api/v1/recommendations/for-user
 * Get personalized recommendations for current user
 */
router.get('/for-user', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required',
        code: 'MISSING_USER_ID',
      });
    }

    const recommendations = await recommendation.getPersonalizedRecommendations(userId, limit, postgresDb, redisDb);

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/similar/:articleId
 * Get articles similar to a given article
 */
router.get('/similar/:articleId', async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID required',
        code: 'MISSING_ARTICLE_ID',
      });
    }

    const similar = await embeddings.findSimilarArticles(articleId, limit, postgresDb, redisDb);

    res.status(200).json({
      success: true,
      data: {
        article_id: articleId,
        similar_articles: similar,
        count: similar.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/related/:articleId
 * Get related articles via item-to-item CF
 */
router.get('/related/:articleId', async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID required',
        code: 'MISSING_ARTICLE_ID',
      });
    }

    const related = await recommendation.findRelatedArticles(articleId, limit, postgresDb, redisDb);

    res.status(200).json({
      success: true,
      data: {
        article_id: articleId,
        related_articles: related,
        count: related.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/category/:categoryId
 * Get trending articles in a category
 */
router.get('/category/:categoryId', async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Category ID required',
        code: 'MISSING_CATEGORY_ID',
      });
    }

    const articles = await postgresDb.getAll(
      `SELECT a.id, a.title, a.description,
              COUNT(DISTINCT i.user_id) as engagement_count,
              AVG(CASE WHEN i.interaction_type = 'like' THEN 1 ELSE 0 END) as engagement_rate
       FROM articles a
       LEFT JOIN interactions i ON a.id = i.article_id
       WHERE a.category_id = $1
       AND a.published_at > NOW() - INTERVAL '7 days'
       GROUP BY a.id, a.title, a.description
       ORDER BY engagement_count DESC
       LIMIT $2`,
      [categoryId, limit]
    );

    res.status(200).json({
      success: true,
      data: {
        category_id: categoryId,
        articles,
        count: articles.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/trending
 * Get trending articles globally
 */
router.get('/trending', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const timeframe = req.query.timeframe || '7d'; // 7d, 30d, 1h

    let intervalSQL = "INTERVAL '7 days'";
    if (timeframe === '1h') intervalSQL = "INTERVAL '1 hour'";
    else if (timeframe === '24h') intervalSQL = "INTERVAL '24 hours'";
    else if (timeframe === '30d') intervalSQL = "INTERVAL '30 days'";

    const articles = await postgresDb.getAll(
      `SELECT a.id, a.title, a.category_id, c.name as category,
              COUNT(DISTINCT i.user_id) as engagement_count,
              AVG(CASE WHEN i.interaction_type = 'like' THEN 1 ELSE 0 END) as engagement_rate
       FROM articles a
       JOIN categories c ON a.category_id = c.id
       LEFT JOIN interactions i ON a.id = i.article_id
       WHERE a.published_at > NOW() - ${intervalSQL}
       GROUP BY a.id, a.title, a.category_id, c.name
       HAVING COUNT(DISTINCT i.user_id) > 5
       ORDER BY engagement_count DESC, engagement_rate DESC
       LIMIT $1`,
      [limit]
    );

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        articles,
        count: articles.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/popular
 * Get popular articles (no user context)
 */
router.get('/popular', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const articles = await postgresDb.getAll(
      `SELECT a.id, a.title, a.category_id, c.name as category,
              COUNT(DISTINCT i.user_id) as engagement_count
       FROM articles a
       JOIN categories c ON a.category_id = c.id
       LEFT JOIN interactions i ON a.id = i.article_id
       WHERE a.published_at > NOW() - INTERVAL '30 days'
       GROUP BY a.id, a.title, a.category_id, c.name
       ORDER BY engagement_count DESC
       LIMIT $1`,
      [limit]
    );

    res.status(200).json({
      success: true,
      data: {
        articles,
        count: articles.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/recommendations/feedback
 * Record user feedback on recommendation (like/dislike)
 */
router.post('/feedback', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { article_id, feedback_type } = req.body;

    if (!article_id || !['helpful', 'not_helpful'].includes(feedback_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid article_id or feedback_type',
        code: 'VALIDATION_ERROR',
      });
    }

    await postgresDb.query(
      `INSERT INTO recommendation_feedback (id, user_id, article_id, feedback_type, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       ON CONFLICT (user_id, article_id) DO UPDATE
       SET feedback_type = $3, created_at = NOW()`,
      [userId, article_id, feedback_type]
    );

    res.status(200).json({
      success: true,
      data: { message: 'Feedback recorded' },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
