'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Clock, ExternalLink, Eye, Share2, X } from 'lucide-react';
import { API_BASE } from '@/lib/constants';
import type { Article, FeedResponse } from '@/lib/api';
import { TrendingBanner } from './TrendingBanner';
import { ArticleGrid } from './ArticleGrid';
import { RemoteImage } from './RemoteImage';

interface Props {
  trending: Article[];
  feed: {
    articles: Article[];
    pagination: FeedResponse['pagination'];
  };
  lang: string;
  category: string;
}

export function HomeFeedClient({ trending, feed, lang, category }: Props) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [detailArticle, setDetailArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch full article content when popup opens
  useEffect(() => {
    if (!selectedArticle) return;
    let cancelled = false;
    setIsLoading(true);
    fetch(`${API_BASE}/api/v1/articles/${selectedArticle.id}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (!cancelled) {
          const fullArticle = (data?.data?.article ?? data?.article ?? data?.data ?? data) as Article;
          setDetailArticle(fullArticle);
        }
      })
      .catch(() => { if (!cancelled) setDetailArticle(selectedArticle); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedArticle]);

  // Lock body scroll while popup is open
  useEffect(() => {
    if (!selectedArticle) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [selectedArticle]);

  const article = detailArticle || selectedArticle;

  const handleOpen = (a: Article) => {
    setSelectedArticle(a);
    setDetailArticle(null);
  };

  const handleClose = () => {
    setSelectedArticle(null);
    setDetailArticle(null);
    setIsLoading(false);
  };

  const handleShare = async () => {
    if (!article) return;
    if (navigator.share) {
      await navigator.share({ title: article.title, url: article.source_url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(article.source_url).catch(() => {});
    }
  };

  const publishedDate = article?.published_at ? new Date(article.published_at) : null;
  const timeAgo = publishedDate && !isNaN(publishedDate.getTime())
    ? formatDistanceToNow(publishedDate, { addSuffix: true })
    : 'recently';

  const bodyParagraphs = (article?.content || '')
    .split('\n').map(p => p.trim()).filter(Boolean);

  return (
    <>
      {trending.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
            <span>🔥</span> Trending Now
          </h2>
          <TrendingBanner articles={trending} lang={lang} onOpenArticle={handleOpen} />
        </section>
      )}

      <section>
        <ArticleGrid
          articles={feed.articles}
          pagination={feed.pagination}
          lang={lang}
          category={category}
          onOpenArticle={handleOpen}
        />
      </section>

      {/* ── Article Reader Popup ──────────────────────────────── */}
      {article && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="w-full sm:max-w-2xl lg:max-w-3xl bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">

            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Close">
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 truncate">{article.source_name}</p>
                <p className="text-xs text-slate-400 truncate">{article.source_url}</p>
              </div>
              <button onClick={handleShare} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Share">
                <Share2 size={18} />
              </button>
              <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* Hero image */}
              {article.thumbnail_url && (
                <div className="relative w-full h-52 sm:h-72 shrink-0">
                  <RemoteImage
                    src={article.thumbnail_url}
                    alt={article.title}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 720px"
                    priority
                  />
                  {/* Source badge over image */}
                  <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {article.source_name}
                  </span>
                </div>
              )}

              <div className="px-4 sm:px-6 py-5 space-y-4">

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {article.title}
                </h2>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {article.author && <span className="font-medium text-slate-700 dark:text-slate-300">By {article.author}</span>}
                  <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo}</span>
                  <span className="flex items-center gap-1"><Eye size={11} /> {(article.view_count ?? 0).toLocaleString()} views</span>
                  {isLoading && <span className="text-brand-600 dark:text-brand-400 animate-pulse">Loading…</span>}
                </div>

                {/* Summary / content */}
                {article.summary && (
                  <p className="text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed border-l-4 border-brand-500 pl-3">
                    {article.summary}
                  </p>
                )}

                <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed">
                  {bodyParagraphs.length > 0
                    ? bodyParagraphs.map((p, i) => <p key={i}>{p}</p>)
                    : !article.summary && <p className="text-slate-400 italic">Preview not available for this article.</p>
                  }
                </div>

                {/* Read more CTA — prominent, always visible */}
                <div className="pt-2 pb-1">
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors shadow"
                  >
                    <ExternalLink size={16} />
                    Read full article on {article.source_name}
                  </a>
                  <p className="text-center text-xs text-slate-400 mt-2">
                    Opens the original source in a new tab
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
