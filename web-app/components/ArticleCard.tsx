import type { Article } from '@/lib/api';
import { Clock } from 'lucide-react';
import { RemoteImage } from './RemoteImage';
import { formatRelativeTime, getCleanSummary, getSourceInitials } from '@/lib/formatters';

interface Props {
  article: Article;
  compact?: boolean;
  onOpenArticle?: (article: Article) => void;
}

export function ArticleCard({ article, compact = false, onOpenArticle }: Props) {
  const timeAgo = formatRelativeTime(article.published_at);
  const cleanSummary = getCleanSummary(article.title, article.summary, article.content);
  const sourceInitials = getSourceInitials(article.source_name);
  const articleHref = `/article/${article.id}`;

  if (compact) {
    return (
      <a href={articleHref}
        onClick={(e) => {
          if (!onOpenArticle) return;
          e.preventDefault();
          onOpenArticle(article);
        }}
        className="flex gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2.5 rounded-lg transition-colors">
        <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <RemoteImage
            src={article.thumbnail_url}
            alt={article.title}
            sizes="80px"
            className="object-cover"
            fallbackClassName="flex items-center justify-center h-full w-full bg-gradient-to-br from-brand-100 to-brand-50 dark:from-slate-700 dark:to-slate-800"
            fallbackIconClassName="text-[11px] font-bold text-brand-700 dark:text-brand-300"
          />
          {!article.thumbnail_url && (
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-brand-700 dark:text-brand-300">
              {sourceInitials}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-semibold">
              {sourceInitials}
            </span>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-brand-600 dark:text-brand-400 line-clamp-1">
              {article.source_name}
            </p>
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-brand-600
                        dark:group-hover:text-brand-400 transition-colors">
            {article.title}
          </p>
          {cleanSummary && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{cleanSummary}</p>}
          <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>{timeAgo}</p>
        </div>
      </a>
    );
  }

  return (
    <a
      href={articleHref}
      onClick={(e) => {
        if (!onOpenArticle) return;
        e.preventDefault();
        onOpenArticle(article);
      }}
      className="card flex flex-col group hover:-translate-y-0.5 transition-transform duration-200"
    >
      {article.thumbnail_url ? (
        <div className="relative w-full h-40 sm:h-44 flex-shrink-0">
          <RemoteImage
            src={article.thumbnail_url}
            alt={article.title}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
      ) : (
        <div className="w-full h-40 sm:h-44 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-slate-700
                        dark:to-slate-800 flex flex-col items-center justify-center gap-1.5">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/70 dark:bg-slate-900/40 text-brand-700 dark:text-brand-300 text-sm font-bold">
            {sourceInitials}
          </span>
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">No image</span>
        </div>
      )}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 gap-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-500 text-white text-[11px] font-semibold">
            {sourceInitials}
          </span>
          <span className="text-[11px] font-semibold tracking-wide uppercase text-brand-600 dark:text-brand-400 line-clamp-1">
            {article.source_name}
          </span>
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug
                       group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {article.title}
        </h3>
        {cleanSummary && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
            {cleanSummary}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-2
                        border-t border-slate-100 dark:border-slate-700">
          <span className="flex items-center gap-1" suppressHydrationWarning><Clock size={11} /> {timeAgo}</span>
        </div>
      </div>
    </a>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="card flex flex-col">
      <div className="skeleton w-full h-44" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2 mt-2" />
      </div>
    </div>
  );
}

