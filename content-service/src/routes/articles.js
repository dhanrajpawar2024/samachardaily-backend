const express = require('express');
const { pool, query: queryDb, getAll, getOne } = require('../db/postgres');

const router = express.Router();

const getUserId = (req) => req.user?.userId || req.user?.sub || req.headers['x-user-id'] || null;

const parsePage = (value, fallback = 1) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseLimit = (value, fallback = 20, max = 100) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
};

const cleanCommentBody = (body = '') =>
  String(body)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getEngagementCounts = async (articleId, userId = null) => {
  const engagement = await getOne(
    `SELECT
       a.id AS article_id,
       COALESCE(a.view_count, 0)::int AS view_count,
       COALESCE(a.like_count, 0)::int AS like_count,
       COALESCE(a.share_count, 0)::int AS share_count,
       COALESCE(a.comment_count, 0)::int AS comment_count,
       CASE
         WHEN $2::uuid IS NULL THEN FALSE
         ELSE EXISTS (
           SELECT 1 FROM article_likes al
           WHERE al.article_id = a.id AND al.user_id = $2::uuid
         )
       END AS liked_by_user
     FROM articles a
     WHERE a.id = $1`,
    [articleId, userId]
  );

  return engagement;
};

const recordUserInteraction = async (client, userId, articleId, action, metadata = {}) => {
  if (!userId) return;

  await client.query(
    `INSERT INTO user_article_interactions (user_id, article_id, action, metadata, timestamp)
     VALUES ($1, $2, $3, $4::jsonb, NOW())`,
    [userId, articleId, action, JSON.stringify(metadata)]
  );
};

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
        a.view_count, a.like_count, a.share_count, a.comment_count,
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
 * GET /api/v1/articles/:id/engagement
 * Return latest counters and current user's like state.
 */
router.get('/:id/engagement', async (req, res) => {
  try {
    const userId = getUserId(req);
    const engagement = await getEngagementCounts(req.params.id, userId);

    if (!engagement) {
      return res.status(404).json({
        error: 'Article not found',
        code: 'ARTICLE_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: { engagement },
    });
  } catch (error) {
    console.error('[Content] Get engagement error:', error);
    res.status(500).json({
      error: 'Failed to fetch article engagement',
      code: 'FETCH_ENGAGEMENT_FAILED',
    });
  }
});

/**
 * POST /api/v1/articles/:id/view
 * Increment article view count. Auth is optional.
 */
router.post('/:id/view', async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = getUserId(req);
    const durationSeconds = parseInt(req.body?.durationSeconds || req.body?.duration_seconds || 0, 10) || 0;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE articles
       SET view_count = view_count + 1,
           updated_at = NOW()
       WHERE id = $1 AND is_published = TRUE
       RETURNING id, view_count, like_count, share_count, comment_count`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Article not found',
        code: 'ARTICLE_NOT_FOUND',
      });
    }

    await recordUserInteraction(client, userId, req.params.id, 'view', {
      durationSeconds,
      userAgent: req.headers['user-agent'],
    });

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      data: {
        article_id: result.rows[0].id,
        engagement: {
          view_count: result.rows[0].view_count,
          like_count: result.rows[0].like_count,
          share_count: result.rows[0].share_count,
          comment_count: result.rows[0].comment_count,
          liked_by_user: false,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Content] Article view error:', error);
    res.status(500).json({
      error: 'Failed to update view count',
      code: 'ARTICLE_VIEW_UPDATE_FAILED',
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/v1/articles/:id/like
 * Like article. Idempotent for each authenticated user.
 */
router.post('/:id/like', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Login required to like articles', code: 'MISSING_USER_ID' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const article = await client.query(
      'SELECT id FROM articles WHERE id = $1 AND is_published = TRUE',
      [req.params.id]
    );
    if (article.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Article not found', code: 'ARTICLE_NOT_FOUND' });
    }

    const like = await client.query(
      `INSERT INTO article_likes (user_id, article_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, req.params.id]
    );

    if (like.rowCount > 0) {
      await client.query(
        `UPDATE articles
         SET like_count = like_count + 1,
             trending_score = trending_score + 3,
             updated_at = NOW()
         WHERE id = $1`,
        [req.params.id]
      );
      await recordUserInteraction(client, userId, req.params.id, 'like', {
        userAgent: req.headers['user-agent'],
      });
    }

    await client.query('COMMIT');
    const engagement = await getEngagementCounts(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: {
        article_id: req.params.id,
        liked: true,
        engagement,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Content] Article like error:', error);
    res.status(500).json({
      error: 'Failed to like article',
      code: 'ARTICLE_LIKE_FAILED',
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/v1/articles/:id/like
 * Unlike article. Idempotent for each authenticated user.
 */
router.delete('/:id/like', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Login required to unlike articles', code: 'MISSING_USER_ID' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const unlike = await client.query(
      'DELETE FROM article_likes WHERE user_id = $1 AND article_id = $2',
      [userId, req.params.id]
    );

    if (unlike.rowCount > 0) {
      await client.query(
        `UPDATE articles
         SET like_count = GREATEST(like_count - 1, 0),
             updated_at = NOW()
         WHERE id = $1`,
        [req.params.id]
      );
      await recordUserInteraction(client, userId, req.params.id, 'unlike', {
        userAgent: req.headers['user-agent'],
      });
    }

    await client.query('COMMIT');
    const engagement = await getEngagementCounts(req.params.id, userId);

    if (!engagement) {
      return res.status(404).json({ error: 'Article not found', code: 'ARTICLE_NOT_FOUND' });
    }

    res.status(200).json({
      success: true,
      data: {
        article_id: req.params.id,
        liked: false,
        engagement,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Content] Article unlike error:', error);
    res.status(500).json({
      error: 'Failed to unlike article',
      code: 'ARTICLE_UNLIKE_FAILED',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/v1/articles/:id/comments
 * Public paginated comments list.
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const pageNum = parsePage(req.query.page);
    const limitNum = parseLimit(req.query.limit, 20, 50);
    const offset = (pageNum - 1) * limitNum;

    const article = await getOne('SELECT id FROM articles WHERE id = $1 AND is_published = TRUE', [req.params.id]);
    if (!article) {
      return res.status(404).json({ error: 'Article not found', code: 'ARTICLE_NOT_FOUND' });
    }

    const countResult = await queryDb(
      `SELECT COUNT(*)::int AS total
       FROM article_comments
       WHERE article_id = $1 AND is_deleted = FALSE`,
      [req.params.id]
    );

    const comments = await getAll(
      `SELECT
         ac.id,
         ac.article_id,
         ac.user_id,
         u.name AS user_name,
         u.avatar_url AS user_avatar_url,
         ac.body,
         ac.created_at,
         ac.updated_at
       FROM article_comments ac
       JOIN users u ON u.id = ac.user_id
       WHERE ac.article_id = $1 AND ac.is_deleted = FALSE
       ORDER BY ac.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult.rows[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error('[Content] Get comments error:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      code: 'FETCH_COMMENTS_FAILED',
    });
  }
});

/**
 * POST /api/v1/articles/:id/comments
 * Create a comment. Requires authenticated user.
 */
router.post('/:id/comments', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Login required to comment', code: 'MISSING_USER_ID' });
  }

  const body = cleanCommentBody(req.body?.body || req.body?.comment || req.body?.text || '');
  if (!body) {
    return res.status(400).json({ error: 'Comment body is required', code: 'COMMENT_BODY_REQUIRED' });
  }
  if (body.length > 2000) {
    return res.status(400).json({ error: 'Comment body must be 2000 characters or fewer', code: 'COMMENT_TOO_LONG' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const article = await client.query(
      'SELECT id FROM articles WHERE id = $1 AND is_published = TRUE',
      [req.params.id]
    );
    if (article.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Article not found', code: 'ARTICLE_NOT_FOUND' });
    }

    const commentResult = await client.query(
      `INSERT INTO article_comments (article_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, article_id, user_id, body, created_at, updated_at`,
      [req.params.id, userId, body]
    );

    await client.query(
      `UPDATE articles
       SET comment_count = comment_count + 1,
           trending_score = trending_score + 4,
           updated_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    await recordUserInteraction(client, userId, req.params.id, 'comment', {
      commentId: commentResult.rows[0].id,
    });

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        comment: commentResult.rows[0],
        engagement: await getEngagementCounts(req.params.id, userId),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Content] Add comment error:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      code: 'COMMENT_ADD_FAILED',
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/v1/articles/:id/comments/:commentId
 * Soft delete own comment.
 */
router.delete('/:id/comments/:commentId', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Login required to delete comments', code: 'MISSING_USER_ID' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deleted = await client.query(
      `UPDATE article_comments
       SET is_deleted = TRUE,
           updated_at = NOW()
       WHERE id = $1 AND article_id = $2 AND user_id = $3 AND is_deleted = FALSE
       RETURNING id`,
      [req.params.commentId, req.params.id, userId]
    );

    if (deleted.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Comment not found', code: 'COMMENT_NOT_FOUND' });
    }

    await client.query(
      `UPDATE articles
       SET comment_count = GREATEST(comment_count - 1, 0),
           updated_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      data: {
        comment_id: req.params.commentId,
        deleted: true,
        engagement: await getEngagementCounts(req.params.id, userId),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Content] Delete comment error:', error);
    res.status(500).json({
      error: 'Failed to delete comment',
      code: 'COMMENT_DELETE_FAILED',
    });
  } finally {
    client.release();
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
