'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchArticles, type Article } from '@/lib/api';
import { ArticleCard, ArticleCardSkeleton } from '@/components/ArticleCard';
import { Search, X } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const query        = searchParams.get('q') || '';
  const lang         = searchParams.get('lang') || '';
  const page         = Number(searchParams.get('page') || 1);

  const [input,    setInput]    = useState(query);
  const [results,  setResults]  = useState<Article[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);

  const doSearch = useCallback(async (q: string, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await searchArticles(q, lang || undefined, p);
      setResults(res.results ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { if (query) doSearch(query, page); }, [query, page, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="search"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Search news in any language..."
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
          autoFocus
        />
        {input && (
          <button type="button" onClick={() => setInput('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        )}
      </form>

      {/* Results Header */}
      {query && !loading && (
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {total > 0
            ? `${total.toLocaleString()} results for "${query}"`
            : `No results found for "${query}"`}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          {results.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No articles found</p>
          <p className="text-sm mt-1">Try different keywords or select another language</p>
        </div>
      )}

      {/* Initial state */}
      {!query && (
        <div className="text-center py-16 text-slate-400">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Search across 145+ sources</p>
          <p className="text-sm mt-1">News in English, Hindi, Telugu, Tamil and 6 more languages</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}

