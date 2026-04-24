export const LANGUAGES = [
  { code: 'en', label: 'English',    nativeLabel: 'English'    },
  { code: 'hi', label: 'Hindi',      nativeLabel: 'हिंदी'       },
  { code: 'te', label: 'Telugu',     nativeLabel: 'తెలుగు'      },
  { code: 'ta', label: 'Tamil',      nativeLabel: 'தமிழ்'       },
  { code: 'kn', label: 'Kannada',    nativeLabel: 'ಕನ್ನಡ'       },
  { code: 'mr', label: 'Marathi',    nativeLabel: 'मराठी'       },
  { code: 'bn', label: 'Bengali',    nativeLabel: 'বাংলা'       },
  { code: 'gu', label: 'Gujarati',   nativeLabel: 'ગુજરાતી'     },
  { code: 'pa', label: 'Punjabi',    nativeLabel: 'ਪੰਜਾਬੀ'      },
  { code: 'ml', label: 'Malayalam',  nativeLabel: 'മലയാളം'      },
] as const;

export type LangCode = typeof LANGUAGES[number]['code'];

export const CATEGORIES = [
  { slug: 'top-stories',   label: 'Top Stories', icon: '🔥' },
  { slug: 'india',         label: 'India',        icon: '🇮🇳' },
  { slug: 'world',         label: 'World',        icon: '🌍' },
  { slug: 'business',      label: 'Business',     icon: '💼' },
  { slug: 'technology',    label: 'Technology',   icon: '💻' },
  { slug: 'sports',        label: 'Sports',       icon: '🏏' },
  { slug: 'entertainment', label: 'Entertainment',icon: '🎬' },
  { slug: 'health',        label: 'Health',       icon: '❤️' },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

