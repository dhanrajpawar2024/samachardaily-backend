'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import type { Article } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { RemoteImage } from './RemoteImage';

interface Props {
  articles: Article[];
  lang: string;
  onOpenArticle?: (article: Article) => void;
}

export function TrendingBanner({ articles, lang, onOpenArticle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <div className="relative group">
      {/* Scroll Buttons */}
      <button onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white dark:bg-slate-800
                   shadow-lg rounded-full p-1.5 border border-slate-200 dark:border-slate-600
                   opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white dark:bg-slate-800
                   shadow-lg rounded-full p-1.5 border border-slate-200 dark:border-slate-600
                   opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={18} />
      </button>

      {/* Cards */}
      <div ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {articles.map((article, i) => (
          <TrendingCard
            key={article.id}
            article={article}
            rank={i + 1}
            onOpenArticle={onOpenArticle}
          />
        ))}
      </div>
    </div>
  );
}

function TrendingCard({ article, rank, onOpenArticle }: {
  article: Article;
  rank: number;
  onOpenArticle?: (article: Article) => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  const articleHref = `/article/${article.id}`;

  return (
    <a href={articleHref}
      onClick={(e) => {
        if (!onOpenArticle) return;
        e.preventDefault();
        onOpenArticle(article);
      }}
      className="relative flex-shrink-0 w-64 sm:w-72 card snap-start group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
        {article.thumbnail_url ? (
          <RemoteImage
            src={article.thumbnail_url}
            alt={article.title}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="288px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">📰</div>
        )}
        {/* Rank badge */}
        <span className="absolute top-2 left-2 w-7 h-7 bg-brand-500 text-white rounded-full
                         flex items-center justify-center text-xs font-bold shadow">
          {rank}
        </span>
        {/* Trending icon */}
        <span className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
          <TrendingUp size={12} />
        </span>
      </div>

      {/* Text */}
      <div className="p-3">
        <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">{article.source_name}</p>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug
                       group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {article.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5">{timeAgo}</p>
      </div>
    </a>
  );
}

