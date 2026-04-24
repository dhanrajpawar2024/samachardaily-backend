-- Seed categories for ta (Tamil), te (Telugu), bn (Bengali), gu (Gujarati), kn (Kannada), pa (Punjabi)
DO $$
DECLARE
  langs text[] := ARRAY['ta','te','bn','gu','kn','pa'];
  lang text;
  cats text[][] := ARRAY[
    ARRAY['top-stories','sports','politics','business','entertainment','health','technology','india','world'],
    ARRAY['Top Stories','Sports','Politics','Business','Entertainment','Health','Technology','India','World']
  ];
  i int;
BEGIN
  FOREACH lang IN ARRAY langs LOOP
    FOR i IN 1..9 LOOP
      INSERT INTO categories (name, slug, language, is_active, sort_order)
      VALUES (cats[2][i], cats[1][i], lang, TRUE, i)
      ON CONFLICT (slug, language) DO NOTHING;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'New language categories seeded';
END $$;

