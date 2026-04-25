const express = require('express');
const { query: queryValidator, validationResult } = require('express-validator');
const {
  searchArticles,
  getSearchSuggestions,
  getTrendingKeywords,
  getFilterOptions,
} = require('../services/search');

const router = express.Router();

/**
 * GET /api/v1/search
 * Full-text search across articles
 */
router.get(
  '/',
  queryValidator('q').trim().notEmpty().withMessage('Search query required'),
  queryValidator('page').optional().isInt({ min: 1 }).toInt(),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  queryValidator('language').optional().isISO6391(),
  queryValidator('category_id').optional().isUUID(),
  queryValidator('sort_by').optional().isIn(['published_at', 'trending_score', '_score']),
  queryValidator('sort_order').optional().isIn(['asc', 'desc']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        q: query,
        page = 1,
        limit = 20,
        language = 'en',
        category_id,
        author,
        source,
        date_from,
        date_to,
        sort_by,
        sort_order,
      } = req.query;

      const filters = {
        ...(category_id && { category_id }),
        ...(author && { author }),
        ...(source && { source }),
        ...(date_from && { date_from }),
        ...(date_to && { date_to }),
        ...(sort_by && { sort_by }),
        ...(sort_order && { sort_order }),
      };

      const results = await searchArticles(
        query,
        language,
        page,
        limit,
        filters
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('[Search] Error:', error);
      res.status(500).json({
        error: 'Search failed',
        code: 'SEARCH_FAILED',
      });
    }
  }
);

/**
 * GET /api/v1/search/suggestions
 * Get autocomplete suggestions
 */
router.get(
  '/suggestions',
  queryValidator('q').trim().notEmpty().withMessage('Query required'),
  queryValidator('language').optional().isISO6391(),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { q: query, language = 'en', limit = 10 } = req.query;

      const suggestions = await getSearchSuggestions(
        query,
        language,
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      console.error('[Search] Suggestions error:', error);
      res.status(500).json({
        error: 'Failed to get suggestions',
        code: 'SUGGESTIONS_FAILED',
      });
    }
  }
);

/**
 * GET /api/v1/search/trending
 * Get trending keywords
 */
router.get(
  '/trending',
  queryValidator('language').optional().isISO31661Alpha2(),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req, res) => {
    try {
      const { language = 'en', limit = 20 } = req.query;

      const trending = await getTrendingKeywords(
        language,
        Math.min(parseInt(limit), 50)
      );

      res.status(200).json({
        success: true,
        data: trending,
      });
    } catch (error) {
      console.error('[Search] Trending error:', error);
      res.status(500).json({
        error: 'Failed to get trending keywords',
        code: 'TRENDING_FAILED',
      });
    }
  }
);

/**
 * GET /api/v1/search/filters
 * Get available filter options
 */
router.get('/filters', async (req, res) => {
  try {
    const { language = 'en' } = req.query;

    const filters = await getFilterOptions(language);

    res.status(200).json({
      success: true,
      data: filters,
    });
  } catch (error) {
    console.error('[Search] Filters error:', error);
    res.status(500).json({
      error: 'Failed to get filter options',
      code: 'FILTERS_FAILED',
    });
  }
});

module.exports = router;
