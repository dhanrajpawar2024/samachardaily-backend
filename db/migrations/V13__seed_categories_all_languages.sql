-- ============================================================
-- V13: Seed Categories — All 10 Languages (Native Names)
-- ============================================================
-- Covers: en ✓ hi ✓ mr ✓  te ✗ ta ✗ kn ✗ bn ✗ gu ✗ pa ✗ ml ✗
-- This migration adds the 7 missing languages with proper native
-- script names. Uses ON CONFLICT ... DO UPDATE to upgrade any
-- previously inserted English-only placeholder names.
-- ============================================================

-- ── Telugu (te) ──────────────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('ముఖ్య వార్తలు',  'top-stories',   'te',  1),
  ('భారత్',          'india',          'te',  2),
  ('ప్రపంచం',        'world',          'te',  3),
  ('వ్యాపారం',       'business',       'te',  4),
  ('సాంకేతికత',      'technology',     'te',  5),
  ('క్రీడలు',        'sports',         'te',  6),
  ('వినోదం',         'entertainment',  'te',  7),
  ('విజ్ఞానం',       'science',        'te',  8),
  ('ఆరోగ్యం',        'health',         'te',  9),
  ('రాజకీయాలు',      'politics',       'te', 10),
  ('విద్య',           'education',     'te', 11),
  ('జీవనశైలి',       'lifestyle',      'te', 12),
  ('ఆటో',            'auto',           'te', 13),
  ('పర్యటన',         'travel',         'te', 14),
  ('ఆహారం',          'food',           'te', 15)
ON CONFLICT (slug, language) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ── Tamil (ta) ───────────────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('முக்கிய செய்திகள்',  'top-stories',   'ta',  1),
  ('இந்தியா',             'india',          'ta',  2),
  ('உலகம்',               'world',          'ta',  3),
  ('வணிகம்',              'business',       'ta',  4),
  ('தொழில்நுட்பம்',       'technology',     'ta',  5),
  ('விளையாட்டு',           'sports',         'ta',  6),
  ('பொழுதுபோக்கு',        'entertainment',  'ta',  7),
  ('அறிவியல்',             'science',        'ta',  8),
  ('உடல்நலம்',             'health',         'ta',  9),
  ('அரசியல்',              'politics',       'ta', 10),
  ('கல்வி',                'education',      'ta', 11),
  ('வாழ்க்கை முறை',       'lifestyle',      'ta', 12),
  ('ஆட்டோ',               'auto',           'ta', 13),
  ('பயணம்',               'travel',         'ta', 14),
  ('உணவு',                'food',           'ta', 15)
ON CONFLICT (slug, language) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ── Kannada (kn) ─────────────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('ಮುಖ್ಯ ಸುದ್ದಿ',    'top-stories',   'kn',  1),
  ('ಭಾರತ',             'india',          'kn',  2),
  ('ವಿಶ್ವ',             'world',          'kn',  3),
  ('ವ್ಯಾಪಾರ',           'business',       'kn',  4),
  ('ತಂತ್ರಜ್ಞಾನ',        'technology',     'kn',  5),
  ('ಕ್ರೀಡೆ',            'sports',         'kn',  6),
  ('ಮನರಂಜನೆ',           'entertainment',  'kn',  7),
  ('ವಿಜ್ಞಾನ',           'science',        'kn',  8),
  ('ಆರೋಗ್ಯ',            'health',         'kn',  9),
  ('ರಾಜಕೀಯ',            'politics',       'kn', 10),
  ('ಶಿಕ್ಷಣ',            'education',      'kn', 11),
  ('ಜೀವನಶೈಲಿ',          'lifestyle',      'kn', 12),
  ('ಆಟೋ',               'auto',           'kn', 13),
  ('ಪ್ರವಾಸ',            'travel',         'kn', 14),
  ('ಆಹಾರ',              'food',           'kn', 15)
ON CONFLICT (slug, language) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ── Bengali (bn) ─────────────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('প্রধান খবর',    'top-stories',   'bn',  1),
  ('ভারত',          'india',          'bn',  2),
  ('বিশ্ব',         'world',          'bn',  3),
  ('ব্যবসা',        'business',       'bn',  4),
  ('প্রযুক্তি',     'technology',     'bn',  5),
  ('খেলাধুলা',      'sports',         'bn',  6),
  ('বিনোদন',        'entertainment',  'bn',  7),
  ('বিজ্ঞান',       'science',        'bn',  8),
  ('স্বাস্থ্য',     'health',         'bn',  9),
  ('রাজনীতি',       'politics',       'bn', 10),
  ('শিক্ষা',        'education',      'bn', 11),
  ('জীবনধারা',      'lifestyle',      'bn', 12),
  ('অটো',           'auto',           'bn', 13),
  ('ভ্রমণ',         'travel',         'bn', 14),
  ('খাবার',         'food',           'bn', 15)
ON CONFLICT (slug, language) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ── Gujarati (gu) ────────────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('મુખ્ય સમાચાર',  'top-stories',   'gu',  1),
  ('ભારત',          'india',          'gu',  2),
  ('વિશ્વ',         'world',          'gu',  3),
  ('વ્યાપાર',       'business',       'gu',  4),
  ('ટેક્નોલોજી',    'technology',     'gu',  5),
  ('રમત-ગમત',       'sports',         'gu',  6),
  ('મનોરંજન',       'entertainment',  'gu',  7),
  ('વિજ્ઞાન',       'science',        'gu',  8),
  ('સ્વાસ્થ્ય',    'health',         'gu',  9),
  ('રાજકારણ',       'politics',       'gu', 10),
  ('શિક્ષણ',        'education',      'gu', 11),
  ('જીવનશૈલી',      'lifestyle',      'gu', 12),
  ('ઑટો',           'auto',           'gu', 13),
  ('પ્રવાસ',        'travel',         'gu', 14),
  ('ભોજન',          'food',           'gu', 15)
ON CONFLICT (slug, language) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ── Punjabi (pa) ─────────────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('ਮੁੱਖ ਖਬਰਾਂ',    'top-stories',   'pa',  1),
  ('ਭਾਰਤ',           'india',          'pa',  2),
  ('ਦੁਨੀਆ',          'world',          'pa',  3),
  ('ਵਪਾਰ',           'business',       'pa',  4),
  ('ਤਕਨੀਕ',          'technology',     'pa',  5),
  ('ਖੇਡਾਂ',           'sports',         'pa',  6),
  ('ਮਨੋਰੰਜਨ',        'entertainment',  'pa',  7),
  ('ਵਿਗਿਆਨ',         'science',        'pa',  8),
  ('ਸਿਹਤ',           'health',         'pa',  9),
  ('ਰਾਜਨੀਤੀ',        'politics',       'pa', 10),
  ('ਸਿੱਖਿਆ',         'education',      'pa', 11),
  ('ਜੀਵਨ ਸ਼ੈਲੀ',    'lifestyle',      'pa', 12),
  ('ਆਟੋ',            'auto',           'pa', 13),
  ('ਸੈਰ-ਸਪਾਟਾ',      'travel',         'pa', 14),
  ('ਭੋਜਨ',           'food',           'pa', 15)
ON CONFLICT (slug, language) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ── Malayalam (ml) ───────────────────────────────────────────
INSERT INTO categories (name, slug, language, sort_order) VALUES
  ('പ്രധാന വാർത്തകൾ', 'top-stories',   'ml',  1),
  ('ഭാരതം',            'india',          'ml',  2),
  ('ലോകം',             'world',          'ml',  3),
  ('ബിസിനസ്',          'business',       'ml',  4),
  ('സാങ്കേതികവിദ്യ',   'technology',     'ml',  5),
  ('കായികം',           'sports',         'ml',  6),
  ('വിനോദം',           'entertainment',  'ml',  7),
  ('ശാസ്ത്രം',         'science',        'ml',  8),
  ('ആരോഗ്യം',          'health',         'ml',  9),
  ('രാഷ്ട്രീയം',       'politics',       'ml', 10),
  ('വിദ്യാഭ്യാസം',     'education',      'ml', 11),
  ('ജീവിതശൈലി',        'lifestyle',      'ml', 12),
  ('ഓട്ടോ',            'auto',           'ml', 13),
  ('യാത്ര',            'travel',         'ml', 14),
  ('ഭക്ഷണം',           'food',           'ml', 15)
ON CONFLICT (slug, language) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ── Verify ───────────────────────────────────────────────────
DO $$
DECLARE
  total_cats INT;
  lang_count INT;
BEGIN
  SELECT COUNT(*) INTO total_cats FROM categories WHERE is_active = TRUE;
  SELECT COUNT(DISTINCT language) INTO lang_count FROM categories;
  RAISE NOTICE 'Categories seeded: % rows across % languages', total_cats, lang_count;
END $$;

