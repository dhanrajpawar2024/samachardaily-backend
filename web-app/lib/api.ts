import { API_BASE } from './constants';

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

export interface SearchResponse {
  results: Article[];
  total: number;
  page: number;
}

const fetchJson = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const timeoutSignal = AbortSignal.timeout(10000);
  const res = await fetch(url, {
    signal: timeoutSignal,
    next: { revalidate: 60 },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  const data = await res.json();
  return (data.data ?? data) as T;
};

// ── Feed ──────────────────────────────────────────────────────────

export const getFeed = (params: {
  language?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => {
  const q = new URLSearchParams({
    language: params.language || 'en',
    ...(params.category && { category: params.category }),
    page:  String(params.page  ?? 1),
    limit: String(params.limit ?? 20),
  });
  return fetchJson<FeedResponse>(`${API_BASE}/api/v1/feed?${q}`, { next: { revalidate: 120 } });
};

export const getTrending = (language = 'en', limit = 10) =>
  fetchJson<Article[]>(
    `${API_BASE}/api/v1/feed/trending?language=${language}&limit=${limit}`,
    { next: { revalidate: 300 } }
  );

// ── Articles ──────────────────────────────────────────────────────

export const getArticle = (id: string) =>
  fetchJson<{ article: Article }>(`${API_BASE}/api/v1/articles/${id}`, { next: { revalidate: 3600 } })
    .then((payload) => payload.article ?? (payload as unknown as Article));

// ── Search ────────────────────────────────────────────────────────

export const searchArticles = (q: string, language?: string, page = 1) => {
  const params = new URLSearchParams({ q, page: String(page), ...(language && { language }) });
  return fetchJson<SearchResponse>(`${API_BASE}/api/v1/search?${params}`, { cache: 'no-store' });
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
  const q = new URLSearchParams({
    ...(params.language && { language: params.language }),
    page:  String(params.page  ?? 1),
    limit: String(params.limit ?? 24),
  });
  return fetchJson<VideoListResponse>(`${API_BASE}/api/v1/videos?${q}`, { next: { revalidate: 300 } });
};

// ── Client-side helpers ──────────────────────────────────────────

export const recordView = async (articleId: string) => {
  await fetch(`${API_BASE}/api/v1/articles/${articleId}/view`, { method: 'POST' }).catch(() => {});
};

