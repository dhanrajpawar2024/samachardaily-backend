export const API_BASE    = import.meta.env.VITE_API_URL     || 'http://localhost:3000';
export const SCRAPER_BASE = import.meta.env.VITE_SCRAPER_URL || 'http://localhost:3007';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ixbxzqmrqeyxktnqrvhp.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_piOF1BU6q6hjX4o2PLPtsA_vBYWVDD5';

const withSupabaseHeaders = (headers: HeadersInit = {}) => ({
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  ...headers,
});

const get = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const data = await res.json();
  return (data.data ?? data) as T;
};

const post = async <T>(url: string, body?: unknown): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const data = await res.json();
  return (data.data ?? data) as T;
};

const del = async (url: string) => {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
};

// ── Articles ─────────────────────────────────────────────────────
export const getArticles = async (params: Record<string,string|number> = {}) => {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 20);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const q = new URLSearchParams({
    select: 'id,title,source_name,language,published_at,view_count,like_count,share_count,is_published,author,thumbnail_url,categories!left(slug)',
    is_published: 'eq.true',
    order: 'published_at.desc',
  });

  if (params.language) {
    q.set('language', `eq.${String(params.language)}`);
  }

  const url = `${SUPABASE_URL}/rest/v1/articles?${q.toString()}`;
  const response = await fetch(url, {
    headers: withSupabaseHeaders({ Range: `${from}-${to}`, Prefer: 'count=exact' }),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }

  const rows = (await response.json()) as RawAdminArticle[];
  const contentRange = response.headers.get('content-range') || '0-0/0';
  const total = Number(contentRange.split('/')[1] || 0);

  const res = {
    articles: rows ?? [],
    pagination: { page, limit, total },
  };

  return {
    ...res,
    articles: (res.articles ?? []).map(normalizeAdminArticle),
  };
};
export const deleteArticle = (id: string) => del(`${API_BASE}/api/v1/articles/${id}`);

// ── Feed Stats ───────────────────────────────────────────────────
export const getFeedStats = () => get<FeedStats>(`${API_BASE}/api/v1/feed/stats`);

// ── Scraper ──────────────────────────────────────────────────────
export const getScraperHealth  = () => get<ScraperHealth>(`${SCRAPER_BASE}/health`);
export const getScraperStats   = () => get<ScraperStats>(`${SCRAPER_BASE}/api/v1/stats`);
export const getSources        = (params?: Record<string,string>) => {
  const q = params ? '?' + new URLSearchParams(params) : '';
  return get<SourcesResponse>(`${SCRAPER_BASE}/api/v1/sources${q}`);
};
export const triggerScrape     = (body?: { languages?: string[]; categories?: string[] }) =>
  post(`${SCRAPER_BASE}/api/v1/scrape`, body);
export const triggerTrending   = () => post(`${SCRAPER_BASE}/api/v1/trending/recalculate`);
export const triggerCleanup    = () => post(`${SCRAPER_BASE}/api/v1/cleanup`);
export const addSource         = (body: { name: string; language: string; category: string; type: string; url: string }) =>
  post<{ success: boolean; data: Source }>(`${SCRAPER_BASE}/api/v1/sources`, body);

// ── Ads ─────────────────────────────────────────────────────
export const getAds = () => get<AdsResponse>(`${API_BASE}/api/v1/ads`);
export const createAd = (body: AdPayload) => post<{ ad: AdPlacement }>(`${API_BASE}/api/v1/ads`, body);
export const updateAd = async (id: string, body: AdPayload) => {
  const res = await fetch(`${API_BASE}/api/v1/ads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${API_BASE}/api/v1/ads/${id}`);
  const data = await res.json();
  return (data.data ?? data) as { ad: AdPlacement };
};
export const toggleAd = async (id: string, isActive: boolean) => {
  const res = await fetch(`${API_BASE}/api/v1/ads/${id}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) throw new Error(`${res.status} ${API_BASE}/api/v1/ads/${id}/toggle`);
  const data = await res.json();
  return (data.data ?? data) as { ad: AdPlacement };
};
export const deleteAd = (id: string) => del(`${API_BASE}/api/v1/ads/${id}`);

// ── Types ─────────────────────────────────────────────────────────
interface RawAdminArticle {
  id: string;
  title?: string;
  source_name?: string;
  language?: string;
  category?: string;
  category_slug?: string;
  published_at?: string;
  view_count?: number;
  like_count?: number;
  share_count?: number;
  is_published?: boolean;
  author?: string | null;
  thumbnail_url?: string | null;
  categories?: { slug?: string | null } | null;
}

export interface AdminArticle {
  id: string; title: string; source_name: string; language: string;
  category_slug?: string; published_at: string; view_count: number;
  like_count: number; share_count: number; is_published: boolean;
  author?: string; thumbnail_url?: string;
}

const normalizeAdminArticle = (article: RawAdminArticle): AdminArticle => ({
  id: article.id,
  title: article.title || 'Untitled article',
  source_name: article.source_name || 'Unknown source',
  language: article.language || 'unknown',
  category_slug: article.category_slug || article.categories?.slug || article.category || undefined,
  published_at: article.published_at || '',
  view_count: article.view_count ?? 0,
  like_count: article.like_count ?? 0,
  share_count: article.share_count ?? 0,
  is_published: article.is_published ?? true,
  author: article.author || undefined,
  thumbnail_url: article.thumbnail_url || undefined,
});

export interface Pagination { page: number; limit: number; total: number }
export interface FeedStats { total_articles: number; languages: Record<string,number>; categories: Record<string,number> }
export interface ScraperHealth {
  status: string; sources: number; languages: string[]; last_run?: {
    timestamp: string; ingested: number; duration_seconds: number;
  }
}
export interface ScraperStats { last_run: ScraperHealth['last_run']; total_sources: number }
export interface Source { name: string; language: string; category: string; type: string; url: string }
export interface SourcesResponse { total: number; languages: string[]; sources: Source[] }

export interface AdPlacement {
  id: string;
  position_key: string;
  name: string;
  provider: string;
  placement_type: 'script' | 'image' | 'ad_unit';
  article_id_after?: number | null;
  ad_unit_id?: string | null;
  html_snippet?: string | null;
  image_url?: string | null;
  target_url?: string | null;
  language?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface AdsResponse { ads: AdPlacement[] }

export interface AdPayload {
  position_key: string;
  name?: string;
  provider: string;
  placement_type: 'script' | 'image' | 'ad_unit';
  article_id_after?: number | null;
  ad_unit_id?: string | null;
  html_snippet?: string | null;
  image_url?: string | null;
  target_url?: string | null;
  language?: string | null;
  is_active: boolean;
  sort_order: number;
}

