-- Additional Hindi and Marathi sample articles for demo/testing
DO $$
DECLARE
  tech_hi uuid;
  sports_hi uuid;
  business_hi uuid;
  health_hi uuid;
  tech_mr uuid;
  sports_mr uuid;
  business_mr uuid;
  health_mr uuid;
BEGIN
  SELECT id INTO tech_hi FROM categories WHERE slug = 'technology' AND language = 'hi' LIMIT 1;
  SELECT id INTO sports_hi FROM categories WHERE slug = 'sports' AND language = 'hi' LIMIT 1;
  SELECT id INTO business_hi FROM categories WHERE slug = 'business' AND language = 'hi' LIMIT 1;
  SELECT id INTO health_hi FROM categories WHERE slug = 'health' AND language = 'hi' LIMIT 1;

  SELECT id INTO tech_mr FROM categories WHERE slug = 'technology' AND language = 'mr' LIMIT 1;
  SELECT id INTO sports_mr FROM categories WHERE slug = 'sports' AND language = 'mr' LIMIT 1;
  SELECT id INTO business_mr FROM categories WHERE slug = 'business' AND language = 'mr' LIMIT 1;
  SELECT id INTO health_mr FROM categories WHERE slug = 'health' AND language = 'mr' LIMIT 1;

  INSERT INTO articles (title, summary, content, author, source_url, source_name, category_id, language, thumbnail_url, published_at, trending_score, is_published)
  VALUES
    ('भारत में एआई नीति को मिली नई रफ्तार', 'केंद्र सरकार ने आर्टिफिशियल इंटेलिजेंस के लिए नई रूपरेखा जारी की है।', 'नई एआई नीति का उद्देश्य हेल्थ, एजुकेशन और एग्रीटेक सेक्टर में तेज़ी से डिजिटल बदलाव लाना है।', 'डिजिटल डेस्क', 'https://samachardaily.local/hi/ai-policy-1', 'समाचार डेली', tech_hi, 'hi', 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800', NOW() - INTERVAL '1 hour', 81.0, true),
    ('भारतीय टीम ने टेस्ट सीरीज़ अपने नाम की', 'भारत ने इंग्लैंड के खिलाफ टेस्ट सीरीज़ में शानदार जीत दर्ज की।', 'सीरीज़ जीत के साथ टीम इंडिया ने बल्लेबाज़ी और गेंदबाज़ी दोनों में दमदार प्रदर्शन दिखाया।', 'खेल संवाददाता', 'https://samachardaily.local/hi/cricket-series-1', 'खेल समाचार', sports_hi, 'hi', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800', NOW() - INTERVAL '3 hours', 79.0, true),
    ('सेंसेक्स में तेज़ उछाल, निवेशकों में उत्साह', 'घरेलू बाज़ार में तेज़ी से निवेशकों का भरोसा बढ़ा है।', 'एफआईआई निवेश और मजबूत कमाई के चलते बाज़ार में शानदार बढ़त देखी गई।', 'बिज़नेस रिपोर्टर', 'https://samachardaily.local/hi/sensex-rally-1', 'बिज़नेस हिंदी', business_hi, 'hi', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800', NOW() - INTERVAL '5 hours', 74.0, true),
    ('डेंगू वैक्सीन पर आई अच्छी खबर', 'नई वैक्सीन के ट्रायल में मजबूत प्रभावशीलता सामने आई।', 'विशेषज्ञों के मुताबिक यह वैक्सीन कई राज्यों में डेंगू नियंत्रण के लिए बड़ा कदम हो सकती है।', 'हेल्थ डेस्क', 'https://samachardaily.local/hi/dengue-vaccine-1', 'हेल्थ हिंदी', health_hi, 'hi', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', NOW() - INTERVAL '7 hours', 69.0, true),

    ('भारताच्या एआय धोरणाला नवी दिशा', 'केंद्र सरकारने कृत्रिम बुद्धिमत्तेसाठी नवे धोरण जाहीर केले आहे.', 'आरोग्य, शिक्षण आणि उद्योग क्षेत्रात एआयचा वापर वाढवण्यासाठी सरकारने विस्तृत आराखडा मांडला आहे.', 'टेक डेस्क', 'https://samachardaily.local/mr/ai-policy-1', 'समाचार डेली मराठी', tech_mr, 'mr', 'https://images.unsplash.com/photo-1676573960226-1cde0cce96ab?w=800', NOW() - INTERVAL '2 hours', 78.0, true),
    ('भारतीय संघाची मालिकेत दमदार कामगिरी', 'इंग्लंडविरुद्ध मालिकेत भारताने निर्णायक विजय नोंदवला.', 'फलंदाज आणि गोलंदाज यांच्या संतुलित कामगिरीमुळे भारताने मालिका जिंकली.', 'क्रीडा प्रतिनिधी', 'https://samachardaily.local/mr/cricket-series-1', 'क्रीडा मराठी', sports_mr, 'mr', 'https://images.unsplash.com/photo-1540747913346-19212a4b423a?w=800', NOW() - INTERVAL '4 hours', 77.0, true),
    ('शेअर बाजारात तेजी, गुंतवणूकदार आनंदात', 'सेन्सेक्समध्ये वाढ झाल्याने गुंतवणूकदारांचा उत्साह वाढला आहे.', 'जागतिक संकेत आणि मजबूत निकालांमुळे बाजारात सकारात्मक वातावरण दिसत आहे.', 'बाजार वार्ताहर', 'https://samachardaily.local/mr/market-rally-1', 'बिझनेस मराठी', business_mr, 'mr', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800', NOW() - INTERVAL '6 hours', 71.0, true),
    ('आरोग्य क्षेत्रात डेंगू लसीबाबत मोठी प्रगती', 'नवीन लसीच्या चाचण्यांमध्ये चांगले परिणाम समोर आले.', 'डेंगू नियंत्रणासाठी ही लस भविष्यात महत्त्वाची ठरू शकते, असे तज्ज्ञांचे मत आहे.', 'आरोग्य वार्ताहर', 'https://samachardaily.local/mr/dengue-vaccine-1', 'हेल्थ मराठी', health_mr, 'mr', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', NOW() - INTERVAL '8 hours', 67.0, true)
  ON CONFLICT (source_url) DO NOTHING;
END $$;

