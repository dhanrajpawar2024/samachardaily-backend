import { useEffect, useMemo, useState, useCallback } from 'react';
import { getArticles, deleteArticle, setArticlePublished, WEB_BASE, type AdminArticle } from '../lib/api';
import { Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight, Search, ImageIcon, ImageOff, Link2 } from 'lucide-react';
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
  const [busyId,    setBusyId]    = useState<string | null>(null);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [langFilter,setLangFilter]= useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [hasImageFilter, setHasImageFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [qualityFilter, setQualityFilter] = useState<'all' | 'good' | 'weak' | 'missing'>('all');
  const [publicationFilter, setPublicationFilter] = useState<'published' | 'hidden' | 'all'>('published');
  const LIMIT = 20;

  const qualityOf = (article: AdminArticle): 'good' | 'weak' | 'missing' => {
    const summary = (article.summary || '').trim();
    if (!summary) return 'missing';
    if (summary.length < 80) return 'weak';
    return 'good';
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (langFilter) params.language = langFilter;
      if (sourceFilter.trim()) params.source = sourceFilter.trim();
      if (hasImageFilter !== 'all') params.hasImage = hasImageFilter;
      params.publication = publicationFilter;
      const res = await getArticles(params);
      setArticles(res.articles ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      setArticles([]);
      setError('Could not load articles. Please refresh and try again.');
    }
    finally { setLoading(false); }
  }, [page, langFilter, sourceFilter, hasImageFilter, publicationFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    setBusyId(id);
    setError('');
    try {
      await deleteArticle(id);
      await load();
    } catch {
      setError('Delete failed. Check API/Supabase write permissions.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePublishToggle = async (article: AdminArticle) => {
    const nextValue = !article.is_published;
    const promptText = nextValue ? 'Republish this article?' : 'Hide this article from feed?';
    if (!confirm(promptText)) return;

    setBusyId(article.id);
    setError('');
    try {
      await setArticlePublished(article.id, nextValue);
      await load();
    } catch {
      setError('Publish update failed. Check Supabase write permissions.');
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      const searchMatch = !q || a.title.toLowerCase().includes(q) || a.source_name.toLowerCase().includes(q);
      const qualityMatch = qualityFilter === 'all' || qualityOf(a) === qualityFilter;
      return searchMatch && qualityMatch;
    });
  }, [articles, search, qualityFilter]);

  const sourceSuggestions = useMemo(
    () => Array.from(new Set(articles.map(a => a.source_name).filter(Boolean))).slice(0, 25),
    [articles]
  );

  const qualityClass = (value: 'good' | 'weak' | 'missing') =>
    clsx('badge', {
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300': value === 'good',
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300': value === 'weak',
      'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300': value === 'missing',
    });

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Articles</h2>
          <p className="text-sm text-slate-500">{total.toLocaleString()} total articles ({filtered.length} on screen)</p>
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
          <select value={publicationFilter} onChange={e => { setPublicationFilter(e.target.value as 'published' | 'hidden' | 'all'); setPage(1); }}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="all">Published + Hidden</option>
          </select>
          <select value={hasImageFilter} onChange={e => { setHasImageFilter(e.target.value as 'all' | 'yes' | 'no'); setPage(1); }}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
            <option value="all">All Images</option>
            <option value="yes">Has Image</option>
            <option value="no">No Image</option>
          </select>
          <select value={qualityFilter} onChange={e => setQualityFilter(e.target.value as 'all' | 'good' | 'weak' | 'missing')}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
            <option value="all">All Summary Quality</option>
            <option value="good">Good Summary</option>
            <option value="weak">Weak Summary</option>
            <option value="missing">Missing Summary</option>
          </select>
          <button onClick={load} className="btn-ghost text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Search + source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter on loaded rows (title/source)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <input
            list="source-options"
            value={sourceFilter}
            onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            placeholder="Server-side source filter (e.g. NDTV)"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <datalist id="source-options">
            {sourceSuggestions.map(source => <option key={source} value={source} />)}
          </datalist>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b">
              <tr>
                {['Title', 'Source', 'Quality', 'Media', 'Language', 'Category', 'Published', 'Views', 'Actions'].map(h => (
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
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center text-slate-400 py-12">No articles found</td></tr>
              ) : filtered.map(article => (
                <tr key={article.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="table-cell max-w-sm">
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
                    <span className={qualityClass(qualityOf(article))}>{qualityOf(article)}</span>
                  </td>
                  <td className="table-cell whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {article.thumbnail_url ? (
                      <span className="inline-flex items-center gap-1"><ImageIcon size={14} /> Image</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><ImageOff size={14} /> None</span>
                    )}
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
                      <a href={`${WEB_BASE}/article/${article.id}`} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-500">
                        <Eye size={15} />
                      </a>
                      {article.source_url && (
                        <a href={article.source_url} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500"
                          title="Open source">
                          <Link2 size={15} />
                        </a>
                      )}
                      <button
                        onClick={() => handlePublishToggle(article)}
                        disabled={busyId === article.id}
                        className={clsx(
                          'p-1.5 rounded transition-colors disabled:opacity-50',
                          article.is_published
                            ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500'
                            : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-500'
                        )}
                        title={article.is_published ? 'Hide from feed' : 'Republish'}
                      >
                        {article.is_published ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => handleDelete(article.id)}
                        disabled={busyId === article.id}
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

