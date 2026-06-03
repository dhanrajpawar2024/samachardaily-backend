'use client';

import { TrendingUp } from 'lucide-react';
import type { Article } from '@/lib/api';
import { RemoteImage } from './RemoteImage';
import { formatRelativeTime } from '@/lib/formatters';

interface Props {
  articles: Article[];
  lang: string;
  onOpenArticle?: (article: Article) => void;
}

export function TrendingBanner({ articles, lang, onOpenArticle }: Props) {
  void lang;

  if (!articles.length) return null;

  const [leadArticle, ...restArticles] = articles;

  return (
    <div className="rounded-2xl border border-brand-200/60 dark:border-brand-900/40 bg-gradient-to-br from-brand-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-3 sm:p-4">
      <TrendingLeadCard article={leadArticle} rank={1} onOpenArticle={onOpenArticle} />

      {restArticles.length > 0 && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {restArticles.slice(0, 6).map((article, index) => (
            <TrendingRailItem
              key={article.id}
              article={article}
              rank={index + 2}
              onOpenArticle={onOpenArticle}
            />
          ))}
        </div>
      )}

      {articles.length > 7 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {articles.slice(7).map((article, i) => (
            <a
              key={article.id}
              href={`/article/${article.id}`}
              onClick={(e) => {
                if (!onOpenArticle) return;
                e.preventDefault();
                onOpenArticle(article);
              }}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              <TrendingUp size={12} />
              <span>#{i + 8}</span>
              <span className="line-clamp-1 max-w-[11rem]">{article.title}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendingLeadCard({ article, rank, onOpenArticle }: {
  article: Article;
  rank: number;
  onOpenArticle?: (article: Article) => void;
}) {
  const timeAgo = formatRelativeTime(article.published_at);

  return (
    <a
      href={`/article/${article.id}`}
      onClick={(e) => {
        if (!onOpenArticle) return;
        e.preventDefault();
        onOpenArticle(article);
      }}
      className="group block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_1fr]">
        <div className="relative h-44 sm:h-full min-h-[11rem] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
          {article.thumbnail_url ? (
            <RemoteImage
              src={article.thumbnail_url}
              alt={article.title}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl">📰</div>
          )}
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-brand-500 text-white text-xs font-semibold px-2 py-1 shadow">
            <TrendingUp size={12} /> #{rank}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-2.5">
          <p className="text-xs font-semibold tracking-wide uppercase text-brand-600 dark:text-brand-400 line-clamp-1">
            {article.source_name}
          </p>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {article.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-auto" suppressHydrationWarning>{timeAgo}</p>
        </div>
      </div>
    </a>
  );
}

function TrendingRailItem({ article, rank, onOpenArticle }: {
  article: Article;
  rank: number;
  onOpenArticle?: (article: Article) => void;
}) {
  const timeAgo = formatRelativeTime(article.published_at);

  return (
    <a href={`/article/${article.id}`}
      onClick={(e) => {
        if (!onOpenArticle) return;
        e.preventDefault();
        onOpenArticle(article);
      }}
      className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 hover:border-brand-300/70 transition-colors p-2.5"
    >
      <div className="flex items-start gap-2.5">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-500 text-white text-[11px] font-semibold shrink-0 mt-0.5">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-brand-600 dark:text-brand-400 line-clamp-1">
            {article.source_name}
          </p>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {article.title}
          </h4>
          <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>{timeAgo}</p>
        </div>
      </div>
    </a>
  );
}

