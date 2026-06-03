-- Phase 1 cleanup: normalize existing preview data quality
-- Safe to run multiple times.

BEGIN;

-- 1) Remove HTML tags and excess whitespace from summary.
UPDATE articles
SET summary = NULLIF(
  trim(
    regexp_replace(
      regexp_replace(COALESCE(summary, ''), '<[^>]+>', ' ', 'g'),
      '\\s+', ' ', 'g'
    )
  ),
  ''
),
updated_at = NOW()
WHERE summary IS NOT NULL;

-- 2) If summary starts with title, drop the duplicate title prefix.
UPDATE articles
SET summary = NULLIF(
  trim(
    ltrim(
      substring(summary FROM char_length(title) + 1),
      ' -:|,.'
    )
  ),
  ''
),
updated_at = NOW()
WHERE summary IS NOT NULL
  AND title IS NOT NULL
  AND lower(summary) LIKE lower(title) || '%';

-- 3) Cap summary to ~260 chars for clean card previews.
UPDATE articles
SET summary = CASE
  WHEN char_length(summary) > 260 THEN left(summary, 257) || '...'
  ELSE summary
END,
updated_at = NOW()
WHERE summary IS NOT NULL;

-- 4) Null out clearly invalid thumbnails.
UPDATE articles
SET thumbnail_url = NULL,
updated_at = NOW()
WHERE thumbnail_url IS NOT NULL
  AND (
    thumbnail_url !~* '^https?://'
    OR thumbnail_url ~* '^https?://[^/]+/?$'
  );

COMMIT;
