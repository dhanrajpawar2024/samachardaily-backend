import Link from 'next/link';
import type { AdPlacement, Article, FeedResponse } from '@/lib/api';
import { ArticleCard } from './ArticleCard';
import { AdSlot } from './AdSlot';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  articles: Article[];
  pagination: FeedResponse['pagination'];
  lang: string;
  category: string;
  onOpenArticle?: (article: Article) => void;
  ads?: AdPlacement[];
}

export function ArticleGrid({ articles, pagination, lang, category, onOpenArticle, ads = [] }: Props) {
  const { page, total, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  if (!articles.length) {
    return (
      <div className="text-center py-24 text-slate-400">
        <p className="text-5xl mb-4">📭</p>
        <p className="text-lg font-medium">No articles found</p>
        <p className="text-sm mt-1">Try another language or category</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
        {articles.flatMap((article, index) => {
          const insertAds = ads.filter(ad => ad.article_id_after === index + 1);
          return [
            <ArticleCard key={article.id} article={article} onOpenArticle={onOpenArticle} />,
            ...insertAds.map(ad => (
              <div key={ad.id} className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <AdSlot ad={ad} />
              </div>
            )),
          ];
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {page > 1 && (
            <Link
              href={`/?lang=${lang}&category=${category}&page=${page - 1}`}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300
                         dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft size={16} /> Prev
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Page <strong className="text-slate-800 dark:text-slate-100">{page}</strong> of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/?lang=${lang}&category=${category}&page=${page + 1}`}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300
                         dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Next <ChevronRight size={16} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

