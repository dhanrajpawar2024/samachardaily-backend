const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://ixbxzqmrqeyxktnqrvhp.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_piOF1BU6q6hjX4o2PLPtsA_vBYWVDD5';

export interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  thumbnail_url?: string;
  source_url: string;
  source_name: string;
  author?: string;
  language: string;
  country_code?: string | null;
  category_id?: string;
  category_slug?: string;
  published_at: string;
  view_count: number;
  like_count: number;
  share_count: number;
  trending_score?: number;
  is_premium?: boolean;
}

export interface FeedResponse {
  articles: Article[];
  pagination: { page: number; limit: number; total: number };
}

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
}

export interface SearchResponse {
  results: Article[];
  total: number;
  page: number;
}

const withSupabaseHeaders = (headers: HeadersInit = {}) => ({
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  ...headers,
});

const fetchJson = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const timeoutSignal = AbortSignal.timeout(10000);
  const res = await fetch(url, {
    signal: timeoutSignal,
    headers: withSupabaseHeaders(options?.headers),
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  const data = await res.json();
  return data as T;
};

const mapArticle = (row: any): Article => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  content: row.content,
  thumbnail_url: row.thumbnail_url,
  source_url: row.source_url,
  source_name: row.source_name,
  author: row.author,
  language: row.language,
  country_code: row.country_code,
  category_id: row.category_id,
  category_slug: row.categories?.slug,
  published_at: row.published_at,
  view_count: row.view_count || 0,
  like_count: row.like_count || 0,
  share_count: row.share_count || 0,
  trending_score: row.trending_score || 0,
  is_premium: row.is_premium || false,
});

// ── Feed ──────────────────────────────────────────────────────────

export const getFeed = (params: {
  language?: string;
  category?: string;
  country?: string;
  page?: number;
  limit?: number;
}): Promise<FeedResponse> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const query = new URLSearchParams({
    select: 'id,title,summary,content,thumbnail_url,source_url,source_name,author,language,country_code,category_id,published_at,trending_score,view_count,like_count,share_count,is_premium,categories!left(slug)',
    is_published: 'eq.true',
    order: 'published_at.desc',
  });

  if (params.language) query.set('language', `eq.${params.language}`);
  if (params.category && params.category !== 'top-stories') query.set('categories.slug', `eq.${params.category}`);
  if (params.country) query.set('country_code', `eq.${params.country.toLowerCase()}`);

  const url = `${SUPABASE_URL}/rest/v1/articles?${query.toString()}`;

  return fetch(url, {
    headers: withSupabaseHeaders({ Range: `${from}-${to}`, Prefer: 'count=exact' }),
    next: { revalidate: 120 },
  }).then(async (res) => {
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
    const rows = await res.json();
    const contentRange = res.headers.get('content-range') || '0-0/0';
    const total = Number(contentRange.split('/')[1] || 0);
    return {
      articles: (rows || []).map(mapArticle),
      pagination: { page, limit, total },
    };
  });
};

export const getTrending = (language = 'en', limit = 10, country?: string) =>
  fetchJson<any[]>(
    `${SUPABASE_URL}/rest/v1/articles?select=id,title,summary,content,thumbnail_url,source_url,source_name,author,language,country_code,category_id,published_at,trending_score,view_count,like_count,share_count,is_premium,categories!left(slug)&is_published=eq.true&language=eq.${language}${country ? `&country_code=eq.${country.toLowerCase()}` : ''}&order=trending_score.desc,published_at.desc&limit=${limit}`,
    { next: { revalidate: 300 } }
  ).then((rows) => (rows || []).map(mapArticle));

export const getActiveAds = (params: { language?: string; position?: string } = {}) => {
  const q = new URLSearchParams({
    select: 'id,position_key,name,provider,placement_type,article_id_after,ad_unit_id,html_snippet,image_url,target_url,language,is_active,sort_order',
    is_active: 'eq.true',
    order: 'sort_order.asc',
    ...(params.language && { language: params.language }),
    ...(params.position && { position_key: `eq.${params.position}` }),
  });
  return fetchJson<AdPlacement[]>(
    `${SUPABASE_URL}/rest/v1/ad_placements?${q.toString()}`,
    { next: { revalidate: 120 } }
  ).then((rows) => rows ?? []);
};

// ── Articles ──────────────────────────────────────────────────────

export const getArticle = (id: string) =>
  fetchJson<any[]>(
    `${SUPABASE_URL}/rest/v1/articles?select=id,title,summary,content,thumbnail_url,source_url,source_name,author,language,country_code,category_id,published_at,trending_score,view_count,like_count,share_count,is_premium,categories!left(slug)&id=eq.${id}&limit=1`,
    { next: { revalidate: 3600 } }
  ).then((rows) => {
    if (!rows?.length) throw new Error('Article not found');
    return mapArticle(rows[0]);
  });

// ── Search ────────────────────────────────────────────────────────

export const searchArticles = (q: string, language?: string, page = 1) => {
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const params = new URLSearchParams({
    select: 'id,title,summary,content,thumbnail_url,source_url,source_name,author,language,country_code,category_id,published_at,trending_score,view_count,like_count,share_count,is_premium,categories!left(slug)',
    is_published: 'eq.true',
    or: `(title.ilike.*${q}*,summary.ilike.*${q}*,content.ilike.*${q}*)`,
    ...(language && { language: `eq.${language}` }),
    order: 'published_at.desc',
  });

  const url = `${SUPABASE_URL}/rest/v1/articles?${params.toString()}`;
  return fetch(url, {
    headers: withSupabaseHeaders({ Range: `${from}-${to}`, Prefer: 'count=exact' }),
    cache: 'no-store',
  }).then(async (res) => {
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
    const rows = await res.json();
    const contentRange = res.headers.get('content-range') || '0-0/0';
    const total = Number(contentRange.split('/')[1] || 0);
    return { results: (rows || []).map(mapArticle), total, page };
  });
};

// ── Videos ────────────────────────────────────────────────────────

export interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  author_name?: string;
  language: string;
  category_name?: string;
  view_count: number;
  like_count: number;
  published_at: string;
}

export interface VideoListResponse {
  videos: Video[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export const getVideos = (params: { language?: string; page?: number; limit?: number } = {}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 24;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const q = new URLSearchParams({
    select: 'id,title,description,video_url,thumbnail_url,author_name,language,category_name,view_count,like_count,published_at',
    ...(params.language && { language: `eq.${params.language}` }),
    order: 'published_at.desc',
  });

  const url = `${SUPABASE_URL}/rest/v1/videos?${q.toString()}`;
  return fetch(url, {
    headers: withSupabaseHeaders({ Range: `${from}-${to}`, Prefer: 'count=exact' }),
    next: { revalidate: 300 },
  }).then(async (res) => {
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
    const rows = await res.json();
    const contentRange = res.headers.get('content-range') || '0-0/0';
    const total = Number(contentRange.split('/')[1] || 0);
    return {
      videos: rows || [],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  });
};

// ── Client-side helpers ──────────────────────────────────────────

export const recordView = async (articleId: string) => {
  // Minimal mode: read-only frontend does not write interactions.
  void articleId;
};

