const express = require('express');
const { query: queryDb, getAll, getOne } = require('../db/postgres');

const router = express.Router();

/**
 * GET /api/v1/articles
 * Get paginated list of articles with filters
 * Query: page, limit, category, language, search
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      language = 'en',
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page

    let whereClause = 'WHERE is_published = TRUE';
    const params = [];

    if (category) {
      whereClause += ' AND c.slug = $' + (params.length + 1);
      params.push(category);
    }

    if (language) {
      whereClause += ' AND a.language = $' + (params.length + 1);
      params.push(language);
    }

    if (search) {
      whereClause += ' AND (a.title ILIKE $' + (params.length + 1) + ' OR a.summary ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

    const countResult = await queryDb(
      `SELECT COUNT(*) as total FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const articles = await getAll(
      `SELECT 
        a.id, a.title, a.summary, a.thumbnail_url, a.source_name,
        a.author, a.published_at, a.trending_score,
        c.name as category
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       ${whereClause}
       ORDER BY a.published_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        articles,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('[Content] Get articles error:', error);
    res.status(500).json({
      error: 'Failed to fetch articles',
      code: 'FETCH_ARTICLES_FAILED',
    });
  }
});

/**
 * GET /api/v1/categories
 * Get all categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await getAll(
      'SELECT id, name, slug, language, icon_url, is_active FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC, name ASC'
    );

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('[Content] Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      code: 'FETCH_CATEGORIES_FAILED',
    });
  }
});

/**
 * GET /api/v1/articles/:id
 * Get single article by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await getOne(
      `SELECT 
        a.*, c.name as category
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.id = $1`,
      [id]
    );

    if (!article) {
      return res.status(404).json({
        error: 'Article not found',
        code: 'ARTICLE_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: { article },
    });
  } catch (error) {
    console.error('[Content] Get article error:', error);
    res.status(500).json({
      error: 'Failed to fetch article',
      code: 'FETCH_ARTICLE_FAILED',
    });
  }
});


/**
 * GET /api/v1/categories/:categoryId
 * Get articles by category
 */
router.get('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 100);

    const articles = await getAll(
      `SELECT 
        a.id, a.title, a.summary, a.thumbnail_url, a.source_name,
        a.author, a.published_at, a.trending_score,
        c.name as category
       FROM articles a
       JOIN categories c ON a.category_id = c.id
       WHERE a.category_id = $1 AND a.is_published = TRUE
       ORDER BY a.published_at DESC
       LIMIT $2 OFFSET $3`,
      [categoryId, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      data: { articles, page: parseInt(page), limit: limitNum },
    });
  } catch (error) {
    console.error('[Content] Get category articles error:', error);
    res.status(500).json({
      error: 'Failed to fetch category articles',
      code: 'FETCH_CATEGORY_ARTICLES_FAILED',
    });
  }
});

module.exports = router;
