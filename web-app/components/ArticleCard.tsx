import { formatDistanceToNow } from 'date-fns';
import type { Article } from '@/lib/api';
import { Clock, Eye } from 'lucide-react';
import { RemoteImage } from './RemoteImage';

interface Props {
  article: Article;
  compact?: boolean;
  onOpenArticle?: (article: Article) => void;
}

export function ArticleCard({ article, compact = false, onOpenArticle }: Props) {
  const publishedDate = article.published_at ? new Date(article.published_at) : null;
  const timeAgo = publishedDate && !isNaN(publishedDate.getTime())
    ? formatDistanceToNow(publishedDate, { addSuffix: true })
    : 'recently';
  const articleHref = `/article/${article.id}`;

  if (compact) {
    return (
      <a href={articleHref}
        onClick={(e) => {
          if (!onOpenArticle) return;
          e.preventDefault();
          onOpenArticle(article);
        }}
        className="flex gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors">
        {article.thumbnail_url && (
          <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden">
            <RemoteImage
              src={article.thumbnail_url}
              alt={article.title}
              sizes="80px"
              className="object-cover"
              fallbackClassName="flex items-center justify-center h-full w-full bg-gradient-to-br from-brand-50 to-brand-100 dark:from-slate-700 dark:to-slate-800"
              fallbackIconClassName="text-xl"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-brand-600
                        dark:group-hover:text-brand-400 transition-colors">
            {article.title}
          </p>
          <p className="text-xs text-slate-400 mt-1">{article.source_name} · {timeAgo}</p>
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
      className="card flex flex-col group"
    >
      {article.thumbnail_url ? (
        <div className="relative w-full h-44 flex-shrink-0">
          <RemoteImage
            src={article.thumbnail_url}
            alt={article.title}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-slate-700
                        dark:to-slate-800 flex items-center justify-center text-4xl">
          📰
        </div>
      )}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <span className="badge bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 self-start">
          {article.source_name}
        </span>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug
                       group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {article.summary}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-2
                        border-t border-slate-100 dark:border-slate-700">
          <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo}</span>
          <span className="flex items-center gap-1"><Eye size={11} /> {(article.view_count ?? 0).toLocaleString()}</span>
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

