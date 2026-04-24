import { useEffect, useState, useCallback } from 'react';
import { getArticles, deleteArticle, type AdminArticle } from '../lib/api';
import { Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧', hi: '🇮🇳', te: '🔱', ta: '🌺', kn: '🐘', mr: '🦁', bn: '🐯', gu: '🦚', pa: '🌾', ml: '🌴',
};

export function Articles() {
  const [articles,  setArticles]  = useState<AdminArticle[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [langFilter,setLangFilter]= useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (langFilter) params.language = langFilter;
      const res = await getArticles(params);
      setArticles(res.articles ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  }, [page, langFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await deleteArticle(id).catch(() => {});
    load();
  };

  const totalPages = Math.ceil(total / LIMIT);

  const filtered = search
    ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    : articles;

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Articles</h2>
          <p className="text-sm text-slate-500">{total.toLocaleString()} total articles</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Language filter */}
          <select value={langFilter} onChange={e => { setLangFilter(e.target.value); setPage(1); }}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5
                       bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
            <option value="">All Languages</option>
            {['en','hi','te','ta','kn','mr','bn','gu','pa','ml'].map(l => (
              <option key={l} value={l}>{LANG_FLAGS[l]} {l.toUpperCase()}</option>
            ))}
          </select>
          <button onClick={load} className="btn-ghost text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter by title..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b">
              <tr>
                {['Title', 'Source', 'Language', 'Category', 'Published', 'Views', 'Actions'].map(h => (
                  <th key={h} className="table-cell text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-slate-400 py-12">No articles found</td></tr>
              ) : filtered.map(article => (
                <tr key={article.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="table-cell max-w-xs">
                    <p className="line-clamp-2 text-slate-800 dark:text-slate-100 font-medium leading-snug">
                      {article.title}
                    </p>
                    {article.author && (
                      <p className="text-xs text-slate-400 mt-0.5">by {article.author}</p>
                    )}
                  </td>
                  <td className="table-cell whitespace-nowrap">
                    <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {article.source_name}
                    </span>
                  </td>
                  <td className="table-cell whitespace-nowrap">
                    <span className="badge bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                      {LANG_FLAGS[article.language] || ''} {article.language.toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {article.category_slug || '—'}
                  </td>
                  <td className="table-cell whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                  </td>
                  <td className="table-cell text-slate-500 dark:text-slate-400">
                    {article.view_count.toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <a href={`http://localhost:4000/article/${article.id}`} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-500">
                        <Eye size={15} />
                      </a>
                      <button onClick={() => handleDelete(article.id)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} ({total.toLocaleString()} total)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-ghost text-xs disabled:opacity-40">
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn-ghost text-xs disabled:opacity-40">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

