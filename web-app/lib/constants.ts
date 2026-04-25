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

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.RAILWAY_SERVICE_API_GATEWAY_URL
    ? `https://${process.env.RAILWAY_SERVICE_API_GATEWAY_URL}`
    : 'https://api-gateway-production-7cbb.up.railway.app');

const INTERNAL_API_BASE =
  process.env.INTERNAL_API_URL ||
  'http://api-gateway.railway.internal:8080';

export const API_BASE = typeof window === 'undefined'
  ? INTERNAL_API_BASE
  : PUBLIC_API_BASE;

// Content-service URL (no auth required — bypasses gateway for public endpoints)
export const CONTENT_BASE = typeof window === 'undefined'
  ? (process.env.INTERNAL_CONTENT_URL || 'http://content-service.railway.internal:3002')
  : (process.env.NEXT_PUBLIC_CONTENT_URL || 'https://content-service-production-8177.up.railway.app');

