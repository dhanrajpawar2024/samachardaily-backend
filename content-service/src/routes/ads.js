const express = require('express');
const { query: queryDb, getAll, getOne } = require('../db/postgres');

const router = express.Router();

const AD_SELECT = `
  id,
  position_key,
  COALESCE(name, position_key) AS name,
  provider,
  placement_type,
  article_id_after,
  ad_unit_id,
  html_snippet,
  image_url,
  target_url,
  language,
  is_active,
  sort_order,
  created_at,
  updated_at
`;

const normalizeText = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
};

const normalizeInt = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildPayload = (body = {}) => ({
  position_key: normalizeText(body.position_key || body.positionKey),
  name: normalizeText(body.name),
  provider: normalizeText(body.provider) || 'custom',
  placement_type: normalizeText(body.placement_type || body.placementType) || 'script',
  article_id_after: normalizeInt(body.article_id_after ?? body.articleIdAfter),
  ad_unit_id: normalizeText(body.ad_unit_id || body.adUnitId),
  html_snippet: normalizeText(body.html_snippet || body.htmlSnippet),
  image_url: normalizeText(body.image_url || body.imageUrl),
  target_url: normalizeText(body.target_url || body.targetUrl),
  language: normalizeText(body.language),
  is_active: body.is_active ?? body.isActive ?? true,
  sort_order: normalizeInt(body.sort_order ?? body.sortOrder, 0),
});

const validatePayload = (payload) => {
  if (!payload.position_key) return 'position_key is required';
  if (!/^[a-z0-9_-]+$/.test(payload.position_key)) {
    return 'position_key may contain only lowercase letters, numbers, underscores, and hyphens';
  }
  if (!['script', 'image', 'ad_unit'].includes(payload.placement_type)) {
    return 'placement_type must be script, image, or ad_unit';
  }
  if (payload.placement_type === 'script' && !payload.html_snippet) {
    return 'html_snippet is required for script ads';
  }
  if (payload.placement_type === 'image' && !payload.image_url) {
    return 'image_url is required for image ads';
  }
  return null;
};

router.get('/', async (req, res) => {
  try {
    const { position, language, active } = req.query;
    const params = [];
    const where = [];

    if (position) {
      params.push(position);
      where.push(`position_key = $${params.length}`);
    }

    if (language) {
      params.push(language);
      where.push(`(language IS NULL OR language = $${params.length})`);
    }

    if (active === 'true') {
      where.push('is_active = TRUE');
    } else if (active === 'false') {
      where.push('is_active = FALSE');
    }

    const ads = await getAll(
      `SELECT ${AD_SELECT}
       FROM ad_placements
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY position_key ASC, sort_order ASC, created_at DESC`,
      params
    );

    res.status(200).json({ success: true, data: { ads } });
  } catch (error) {
    console.error('[Content] Get ads error:', error);
    res.status(500).json({ error: 'Failed to fetch ads', code: 'FETCH_ADS_FAILED' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const { position, language } = req.query;
    const params = [];
    const where = ['is_active = TRUE'];

    if (position) {
      params.push(position);
      where.push(`position_key = $${params.length}`);
    }

    if (language) {
      params.push(language);
      where.push(`(language IS NULL OR language = $${params.length})`);
    }

    const ads = await getAll(
      `SELECT ${AD_SELECT}
       FROM ad_placements
       WHERE ${where.join(' AND ')}
       ORDER BY sort_order ASC, created_at DESC`,
      params
    );

    res.status(200).json({ success: true, data: { ads } });
  } catch (error) {
    console.error('[Content] Get active ads error:', error);
    res.status(500).json({ error: 'Failed to fetch active ads', code: 'FETCH_ACTIVE_ADS_FAILED' });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ error: validationError, code: 'INVALID_AD' });

    const result = await queryDb(
      `INSERT INTO ad_placements (
         position_key, name, provider, placement_type, article_id_after,
         ad_unit_id, html_snippet, image_url, target_url, language,
         is_active, sort_order, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()
       )
       RETURNING ${AD_SELECT}`,
      [
        payload.position_key,
        payload.name,
        payload.provider,
        payload.placement_type,
        payload.article_id_after,
        payload.ad_unit_id,
        payload.html_snippet,
        payload.image_url,
        payload.target_url,
        payload.language,
        Boolean(payload.is_active),
        payload.sort_order,
      ]
    );

    res.status(201).json({ success: true, data: { ad: result.rows[0] } });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'position_key already exists', code: 'AD_EXISTS' });
    }
    console.error('[Content] Create ad error:', error);
    res.status(500).json({ error: 'Failed to create ad', code: 'CREATE_AD_FAILED' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ error: validationError, code: 'INVALID_AD' });

    const result = await queryDb(
      `UPDATE ad_placements
       SET position_key = $2,
           name = $3,
           provider = $4,
           placement_type = $5,
           article_id_after = $6,
           ad_unit_id = $7,
           html_snippet = $8,
           image_url = $9,
           target_url = $10,
           language = $11,
           is_active = $12,
           sort_order = $13,
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${AD_SELECT}`,
      [
        req.params.id,
        payload.position_key,
        payload.name,
        payload.provider,
        payload.placement_type,
        payload.article_id_after,
        payload.ad_unit_id,
        payload.html_snippet,
        payload.image_url,
        payload.target_url,
        payload.language,
        Boolean(payload.is_active),
        payload.sort_order,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ad placement not found', code: 'AD_NOT_FOUND' });
    }

    res.status(200).json({ success: true, data: { ad: result.rows[0] } });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'position_key already exists', code: 'AD_EXISTS' });
    }
    console.error('[Content] Update ad error:', error);
    res.status(500).json({ error: 'Failed to update ad', code: 'UPDATE_AD_FAILED' });
  }
});

router.patch('/:id/toggle', async (req, res) => {
  try {
    const current = await getOne('SELECT is_active FROM ad_placements WHERE id = $1', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Ad placement not found', code: 'AD_NOT_FOUND' });

    const next = req.body?.is_active ?? req.body?.isActive ?? !current.is_active;
    const result = await queryDb(
      `UPDATE ad_placements
       SET is_active = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${AD_SELECT}`,
      [req.params.id, Boolean(next)]
    );

    res.status(200).json({ success: true, data: { ad: result.rows[0] } });
  } catch (error) {
    console.error('[Content] Toggle ad error:', error);
    res.status(500).json({ error: 'Failed to toggle ad', code: 'TOGGLE_AD_FAILED' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await queryDb('DELETE FROM ad_placements WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ad placement not found', code: 'AD_NOT_FOUND' });
    }

    res.status(200).json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    console.error('[Content] Delete ad error:', error);
    res.status(500).json({ error: 'Failed to delete ad', code: 'DELETE_AD_FAILED' });
  }
});

module.exports = router;
