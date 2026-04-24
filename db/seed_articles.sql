-- Seed sample articles for testing
-- Get category IDs first
DO $$
DECLARE
  tech_id uuid;
  sports_id uuid;
  politics_id uuid;
  entertainment_id uuid;
  business_id uuid;
  health_id uuid;
BEGIN
  SELECT id INTO tech_id FROM categories WHERE slug = 'technology' AND language = 'en' LIMIT 1;
  SELECT id INTO sports_id FROM categories WHERE slug = 'sports' AND language = 'en' LIMIT 1;
  SELECT id INTO politics_id FROM categories WHERE slug = 'politics' AND language = 'en' LIMIT 1;
  SELECT id INTO entertainment_id FROM categories WHERE slug = 'entertainment' AND language = 'en' LIMIT 1;
  SELECT id INTO business_id FROM categories WHERE slug = 'business' AND language = 'en' LIMIT 1;
  SELECT id INTO health_id FROM categories WHERE slug = 'health' AND language = 'en' LIMIT 1;

  -- Tech articles
  INSERT INTO articles (title, summary, content, author, source_url, source_name, category_id, language, thumbnail_url, published_at, trending_score, is_published)
  VALUES
    ('India launches new AI policy framework to boost tech sector',
     'The Indian government has released a comprehensive AI policy framework aimed at accelerating artificial intelligence adoption across key sectors including healthcare, agriculture, and education.',
     'The Indian government unveiled an ambitious new AI policy framework on Thursday, outlining a roadmap for the country to become a global leader in artificial intelligence by 2030. The policy includes provisions for AI research funding, data governance, and ethical guidelines for AI deployment.',
     'Tech Reporter', 'https://techcrunch.com/ai-india-policy', 'TechCrunch', tech_id, 'en',
     'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800', NOW() - INTERVAL '2 hours', 85.0, true),

    ('OpenAI announces GPT-5 with breakthrough reasoning capabilities',
     'OpenAI has announced the release of GPT-5, claiming it represents a significant leap in AI reasoning and problem-solving abilities compared to its predecessor.',
     'OpenAI officially announced GPT-5 today, describing it as its most capable AI model yet. The new model reportedly shows dramatic improvements in mathematical reasoning, coding ability, and multimodal understanding.',
     'AI Correspondent', 'https://wired.com/gpt5-release', 'Wired', tech_id, 'en',
     'https://images.unsplash.com/photo-1676573960226-1cde0cce96ab?w=800', NOW() - INTERVAL '5 hours', 95.0, true),

    ('Apple to launch iPhone 17 with folding display technology',
     'Sources close to Apple reveal the upcoming iPhone 17 lineup will feature a revolutionary folding display, marking Apple''s first foray into the foldable phone market.',
     'Apple is set to unveil its most ambitious iPhone redesign yet with the iPhone 17, which will reportedly feature a foldable display. The device is expected to fold vertically, similar to Samsung''s Galaxy Z Flip series.',
     'Mobile Tech Editor', 'https://macrumors.com/iphone17-fold', 'MacRumors', tech_id, 'en',
     'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800', NOW() - INTERVAL '8 hours', 78.0, true),

    ('Reliance Jio announces 6G network trials in India',
     'Reliance Jio has begun 6G network trials in major Indian cities, promising speeds up to 100 times faster than current 5G networks.',
     'Reliance Jio announced the commencement of 6G network trials across Mumbai, Delhi, and Bangalore. The company claims the technology will enable download speeds of up to 1 terabit per second.',
     'Telecom Correspondent', 'https://ndtv.com/jio-6g-trials', 'NDTV', tech_id, 'en',
     'https://images.unsplash.com/photo-1562408590-e32931084e23?w=800', NOW() - INTERVAL '12 hours', 72.0, true);

  -- Sports articles
  INSERT INTO articles (title, summary, content, author, source_url, source_name, category_id, language, thumbnail_url, published_at, trending_score, is_published)
  VALUES
    ('India wins Test series against England 3-1',
     'India secured a commanding 3-1 Test series victory over England, with Virat Kohli scoring his 30th Test century in the final match at The Oval.',
     'India completed a historic Test series win over England at The Oval on Sunday. Virat Kohli''s masterful century anchored India''s second innings total of 350, setting England an improbable target of 400 runs.',
     'Cricket Correspondent', 'https://espncricinfo.com/india-win-series', 'ESPN Cricinfo', sports_id, 'en',
     'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800', NOW() - INTERVAL '3 hours', 90.0, true),

    ('Neeraj Chopra breaks world record at Diamond League',
     'Olympic champion Neeraj Chopra set a new world record of 91.5 meters at the Diamond League meet in Zurich, becoming the first Indian to hold a world record in athletics.',
     'In a stunning display of athletic excellence, Neeraj Chopra hurled the javelin to a world record distance of 91.5 meters at the Diamond League final in Zurich, Switzerland. The throw eclipsed the previous world record of 98.48 meters set by Jan Zelezny.',
     'Athletics Reporter', 'https://timesofindia.com/neeraj-world-record', 'Times of India', sports_id, 'en',
     'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800', NOW() - INTERVAL '6 hours', 88.0, true),

    ('IPL 2026: Mumbai Indians win title for record 6th time',
     'Mumbai Indians clinched their sixth IPL title defeating Chennai Super Kings by 20 runs in a thrilling final at Narendra Modi Stadium.',
     'Mumbai Indians completed their fairytale IPL 2026 campaign with a 20-run victory over Chennai Super Kings in the final at Narendra Modi Stadium, Ahmedabad. Rohit Sharma led from the front with a magnificent 89 off 55 balls.',
     'Cricket Desk', 'https://hindustantimes.com/ipl2026-final', 'Hindustan Times', sports_id, 'en',
     'https://images.unsplash.com/photo-1540747913346-19212a4b423a?w=800', NOW() - INTERVAL '1 day', 82.0, true);

  -- Politics articles
  INSERT INTO articles (title, summary, content, author, source_url, source_name, category_id, language, thumbnail_url, published_at, trending_score, is_published)
  VALUES
    ('Union Budget 2026: Major tax relief for middle class',
     'Finance Minister announces significant income tax cuts for individuals earning up to Rs 15 lakh annually in the Union Budget 2026, along with increased infrastructure spending.',
     'In a populist budget ahead of state elections, Finance Minister presented the Union Budget 2026 with major tax relief for the middle class. Individuals earning up to Rs 15 lakh annually will now pay zero income tax.',
     'Political Correspondent', 'https://thehindu.com/budget-2026', 'The Hindu', politics_id, 'en',
     'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800', NOW() - INTERVAL '4 hours', 93.0, true),

    ('G20 Summit: India proposes new global digital governance framework',
     'India has proposed a comprehensive global digital governance framework at the G20 Summit, calling for international cooperation on AI regulation, data privacy, and cybersecurity.',
     'India made its mark at the G20 Summit by proposing a landmark global digital governance framework. The proposal calls for a multilateral approach to regulating artificial intelligence, ensuring data privacy, and combating cybercrime.',
     'Foreign Affairs Desk', 'https://indianexpress.com/g20-india-digital', 'Indian Express', politics_id, 'en',
     'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800', NOW() - INTERVAL '7 hours', 75.0, true);

  -- Business articles
  INSERT INTO articles (title, summary, content, author, source_url, source_name, category_id, language, thumbnail_url, published_at, trending_score, is_published)
  VALUES
    ('Sensex crosses 1 lakh mark for first time in history',
     'The BSE Sensex breached the historic 1,00,000 mark on Tuesday, driven by strong FII inflows, positive global cues, and robust corporate earnings.',
     'Indian stock markets made history on Tuesday as the BSE Sensex crossed the 1,00,000 mark for the first time ever. The milestone was driven by a confluence of positive factors including strong foreign institutional investor inflows.',
     'Markets Reporter', 'https://moneycontrol.com/sensex-1lakh', 'Moneycontrol', business_id, 'en',
     'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800', NOW() - INTERVAL '2 hours', 92.0, true),

    ('Tata Group acquires Air India stake, plans major expansion',
     'Tata Group has increased its stake in Air India and announced a Rs 50,000 crore expansion plan to make Air India a world-class carrier within the next three years.',
     'The Tata Group announced a massive expansion plan for Air India, committing Rs 50,000 crore to fleet expansion, technology upgrades, and improved passenger experience. The conglomerate also increased its ownership stake in the national carrier.',
     'Business Correspondent', 'https://businessstandard.com/tata-airindia', 'Business Standard', business_id, 'en',
     'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800', NOW() - INTERVAL '9 hours', 70.0, true),

    ('India becomes world''s 3rd largest economy, overtakes Japan',
     'India has officially surpassed Japan to become the world''s third largest economy with a GDP of $4.5 trillion, according to IMF data released on Monday.',
     'India has officially overtaken Japan to become the world''s third largest economy, according to the latest GDP data released by the International Monetary Fund. India''s GDP reached $4.5 trillion in 2025.',
     'Economics Desk', 'https://livemint.com/india-3rd-economy', 'Mint', business_id, 'en',
     'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800', NOW() - INTERVAL '1 day', 88.0, true);

  -- Entertainment articles
  INSERT INTO articles (title, summary, content, author, source_url, source_name, category_id, language, thumbnail_url, published_at, trending_score, is_published)
  VALUES
    ('Bollywood blockbuster "Pushpa 3" breaks all box office records',
     'Allu Arjun''s Pushpa 3 has shattered all box office records, grossing Rs 1,500 crore worldwide in just 3 days of release.',
     'Pushpa 3: The Reckoning has become the fastest Indian film to cross Rs 1,500 crore worldwide, achieving this milestone in just three days. Allu Arjun''s portrayal of the iconic character has been universally praised.',
     'Entertainment Reporter', 'https://filmfare.com/pushpa3-boxoffice', 'Filmfare', entertainment_id, 'en',
     'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800', NOW() - INTERVAL '1 day', 87.0, true),

    ('AR Rahman wins Grammy for best global music album',
     'Music maestro AR Rahman has won his second Grammy Award for Best Global Music Album for his innovative fusion work "Raga Reimagined".',
     'Music legend AR Rahman brought glory to India once again by winning his second Grammy Award at the 68th Grammy Awards ceremony in Los Angeles. His album "Raga Reimagined" blends classical Indian ragas with contemporary electronic music.',
     'Music Desk', 'https://ndtv.com/ar-rahman-grammy', 'NDTV', entertainment_id, 'en',
     'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', NOW() - INTERVAL '2 days', 80.0, true);

  -- Health articles
  INSERT INTO articles (title, summary, content, author, source_url, source_name, category_id, language, thumbnail_url, published_at, trending_score, is_published)
  VALUES
    ('ICMR develops affordable dengue vaccine effective against all 4 strains',
     'Indian Council of Medical Research announces successful Phase 3 trials of a new dengue vaccine that shows 95% efficacy against all four dengue virus strains at just Rs 200 per dose.',
     'The Indian Council of Medical Research has announced a major breakthrough in dengue prevention with the successful completion of Phase 3 clinical trials of a new dengue vaccine. The vaccine, developed in partnership with a Pune-based biotech firm, shows 95% efficacy.',
     'Health Correspondent', 'https://thehindu.com/icmr-dengue-vaccine', 'The Hindu', health_id, 'en',
     'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', NOW() - INTERVAL '6 hours', 76.0, true),

    ('Study: 30 minutes of daily yoga reduces stress by 40%, improves heart health',
     'A major AIIMS study involving 10,000 participants found that just 30 minutes of yoga daily significantly reduces cortisol levels and improves cardiovascular health markers.',
     'A landmark study conducted by the All India Institute of Medical Sciences involving 10,000 participants over two years has confirmed significant health benefits of daily yoga practice. Participants who practiced yoga for 30 minutes daily showed a 40% reduction in cortisol (stress hormone) levels.',
     'Health Reporter', 'https://healthline.com/yoga-study-aiims', 'Healthline', health_id, 'en',
     'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', NOW() - INTERVAL '10 hours', 68.0, true);

  RAISE NOTICE 'Seed articles inserted successfully';
END $$;

-- Update trending scores based on recency
UPDATE articles SET trending_score = trending_score * EXTRACT(EPOCH FROM (NOW() - published_at)) / 3600;
-- Reset negative or zero to small positive
UPDATE articles SET trending_score = 10.0 WHERE trending_score <= 0;

