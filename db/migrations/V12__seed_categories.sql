-- ============================================================
-- V12: Seed Data — Categories (en / hi / mr)
-- ============================================================

-- ── English Categories ──────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('Top Stories',    'top-stories',    'en', 1),
  ('India',          'india',          'en', 2),
  ('World',          'world',          'en', 3),
  ('Business',       'business',       'en', 4),
  ('Technology',     'technology',     'en', 5),
  ('Sports',         'sports',         'en', 6),
  ('Entertainment',  'entertainment',  'en', 7),
  ('Science',        'science',        'en', 8),
  ('Health',         'health',         'en', 9),
  ('Politics',       'politics',       'en', 10),
  ('Education',      'education',      'en', 11),
  ('Lifestyle',      'lifestyle',      'en', 12),
  ('Auto',           'auto',           'en', 13),
  ('Travel',         'travel',         'en', 14),
  ('Food',           'food',           'en', 15);

-- ── Hindi Categories ────────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('मुख्य समाचार',  'top-stories',    'hi', 1),
  ('भारत',          'india',          'hi', 2),
  ('विश्व',         'world',          'hi', 3),
  ('व्यापार',       'business',       'hi', 4),
  ('प्रौद्योगिकी',  'technology',     'hi', 5),
  ('खेल',           'sports',         'hi', 6),
  ('मनोरंजन',       'entertainment',  'hi', 7),
  ('विज्ञान',       'science',        'hi', 8),
  ('स्वास्थ्य',     'health',         'hi', 9),
  ('राजनीति',       'politics',       'hi', 10),
  ('शिक्षा',        'education',      'hi', 11),
  ('जीवन शैली',     'lifestyle',      'hi', 12),
  ('ऑटो',           'auto',           'hi', 13),
  ('यात्रा',        'travel',         'hi', 14),
  ('भोजन',          'food',           'hi', 15);

-- ── Marathi Categories ──────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('मुख्य बातम्या', 'top-stories',    'mr', 1),
  ('भारत',          'india',          'mr', 2),
  ('जग',            'world',          'mr', 3),
  ('व्यवसाय',       'business',       'mr', 4),
  ('तंत्रज्ञान',    'technology',     'mr', 5),
  ('क्रीडा',        'sports',         'mr', 6),
  ('मनोरंजन',       'entertainment',  'mr', 7),
  ('विज्ञान',       'science',        'mr', 8),
  ('आरोग्य',        'health',         'mr', 9),
  ('राजकारण',       'politics',       'mr', 10),
  ('शिक्षण',        'education',      'mr', 11),
  ('जीवनशैली',      'lifestyle',      'mr', 12),
  ('वाहन',          'auto',           'mr', 13),
  ('प्रवास',        'travel',         'mr', 14),
  ('अन्न',          'food',           'mr', 15);

-- ── Seed Ad Placements ──────────────────────────────────────
INSERT INTO ad_placements (position_key, article_id_after, ad_unit_id, is_active) VALUES
  ('feed_after_5',    5,    'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', TRUE),
  ('feed_after_10',   10,   'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', TRUE),
  ('article_bottom',  NULL, 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', TRUE);

