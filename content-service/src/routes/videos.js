const express = require('express');
const { query: queryDb, getAll, getOne } = require('../db/postgres');

const router = express.Router();

/**
 * GET /api/v1/videos
 * Query: page, limit, language, category_id
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      language = 'en',
      category_id,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let whereClause = 'WHERE v.is_published = TRUE';

    if (language) {
      params.push(language);
      whereClause += ` AND v.language = $${params.length}`;
    }

    if (category_id) {
      params.push(category_id);
      whereClause += ` AND v.category_id = $${params.length}`;
    }

    const countResult = await queryDb(
      `SELECT COUNT(*)::int AS total
       FROM videos v
       ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.total || 0;

    const videos = await getAll(
      `SELECT
         v.id,
         v.title,
         v.description,
         v.video_url,
         v.thumbnail_url,
         v.author_id,
         v.author_name,
         v.duration_ms,
         v.language,
         v.category_id,
         c.name AS category_name,
         v.view_count,
         v.like_count,
         v.share_count,
         v.is_published,
         v.published_at,
         v.created_at,
         v.updated_at
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       ${whereClause}
       ORDER BY v.published_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        videos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('[Content] Get videos error:', error);
    res.status(500).json({
      error: 'Failed to fetch videos',
      code: 'FETCH_VIDEOS_FAILED',
    });
  }
});

/**
 * GET /api/v1/videos/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const video = await getOne(
      `SELECT
         v.id,
         v.title,
         v.description,
         v.video_url,
         v.thumbnail_url,
         v.author_id,
         v.author_name,
         v.duration_ms,
         v.language,
         v.category_id,
         c.name AS category_name,
         v.view_count,
         v.like_count,
         v.share_count,
         v.is_published,
         v.published_at,
         v.created_at,
         v.updated_at
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       WHERE v.id = $1 AND v.is_published = TRUE`,
      [req.params.id]
    );

    if (!video) {
      return res.status(404).json({
        error: 'Video not found',
        code: 'VIDEO_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: { video },
    });
  } catch (error) {
    console.error('[Content] Get video error:', error);
    res.status(500).json({
      error: 'Failed to fetch video',
      code: 'FETCH_VIDEO_FAILED',
    });
  }
});

/**
 * POST /api/v1/videos/:id/view
 */
router.post('/:id/view', async (req, res) => {
  try {
    const result = await queryDb(
      `UPDATE videos
       SET view_count = view_count + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, view_count`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Video not found',
        code: 'VIDEO_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        video_id: result.rows[0].id,
        view_count: result.rows[0].view_count,
      },
    });
  } catch (error) {
    console.error('[Content] Video view increment error:', error);
    res.status(500).json({
      error: 'Failed to update view count',
      code: 'VIDEO_VIEW_UPDATE_FAILED',
    });
  }
});

/**
 * POST /api/v1/videos/:id/like
 */
router.post('/:id/like', async (req, res) => {
  try {
    const result = await queryDb(
      `UPDATE videos
       SET like_count = like_count + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, like_count`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Video not found',
        code: 'VIDEO_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        video_id: result.rows[0].id,
        like_count: result.rows[0].like_count,
      },
    });
  } catch (error) {
    console.error('[Content] Video like increment error:', error);
    res.status(500).json({
      error: 'Failed to update like count',
      code: 'VIDEO_LIKE_UPDATE_FAILED',
    });
  }
});

module.exports = router;
