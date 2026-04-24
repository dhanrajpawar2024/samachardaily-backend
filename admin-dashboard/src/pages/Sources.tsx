import { FormEvent, useEffect, useState } from 'react';
import { getSources, triggerScrape, addSource, type Source } from '../lib/api';
import { Play, RefreshCw, Search, Plus, X } from 'lucide-react';
import clsx from 'clsx';

const CATEGORY_COLORS: Record<string, string> = {
  'top-stories': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  india: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  technology: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  sports: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  entertainment: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  health: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  world: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

const LANGUAGES = ['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'pa', 'ml'];
const CATEGORIES = ['top-stories', 'india', 'world', 'business', 'technology', 'sports', 'entertainment', 'health'];

const EMPTY_FORM = { name: '', language: 'en', category: 'top-stories', type: 'rss', url: '' };

export function Sources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [total, setTotal] = useState(0);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const load = async (lang?: string) => {
    setLoading(true);
    try {
      const params = lang ? { language: lang } : undefined;
      const res = await getSources(params);
      setSources(res.sources);
      setTotal(res.total);
      setLanguages(res.languages);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(langFilter || undefined);
  }, [langFilter]);

  const handleScrapeLanguage = async (lang: string) => {
    setScraping(true);
    setScrapeMsg('');
    try {
      await triggerScrape({ languages: [lang] });
      setScrapeMsg(`Scrape triggered for ${lang.toUpperCase()}`);
    } catch {
      setScrapeMsg('Failed to trigger scrape');
    } finally {
      setScraping(false);
      setTimeout(() => setScrapeMsg(''), 4000);
    }
  };

  const handleAddSource = async (e: FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!form.name.trim() || !form.url.trim()) {
      setAddError('Name and URL are required.');
      return;
    }

    setAdding(true);
    try {
      await addSource(form);
      setAddSuccess(`"${form.name}" added successfully. It will be used in the next scrape.`);
      setForm(EMPTY_FORM);
      await load(langFilter || undefined);
      setTimeout(() => {
        setShowModal(false);
        setAddSuccess('');
      }, 1800);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add source');
    } finally {
      setAdding(false);
    }
  };

  const filtered = search
    ? sources.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.url.includes(search))
    : sources;

  const byLang = filtered.reduce<Record<string, Source[]>>((acc, s) => {
    (acc[s.language] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">News Sources</h2>
          <p className="text-sm text-slate-500">
            {total.toLocaleString()} sources across {languages.length} languages
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(langFilter || undefined)} className="btn-ghost text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => {
              setShowModal(true);
              setAddError('');
              setAddSuccess('');
            }}
            className="btn-primary text-sm"
          >
            <Plus size={14} /> Add Source
          </button>
        </div>
      </div>

      {scrapeMsg && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
          {scrapeMsg}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sources..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={langFilter}
          onChange={e => setLangFilter(e.target.value)}
          className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="">All Languages</option>
          {languages.map(l => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-5 w-24 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(byLang).map(([lang, srcs]) => (
          <div key={lang} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                {lang.toUpperCase()} - <span className="text-slate-400 font-normal">{srcs.length} sources</span>
              </h3>
              <button
                onClick={() => handleScrapeLanguage(lang)}
                disabled={scraping}
                className="btn-primary text-xs py-1.5"
              >
                <Play size={12} /> Scrape {lang.toUpperCase()} Now
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {srcs.map((src, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-100 leading-tight">{src.name}</p>
                    <span
                      className={clsx(
                        'badge flex-shrink-0',
                        CATEGORY_COLORS[src.category] || 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {src.category}
                    </span>
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-brand-500 truncate transition-colors"
                  >
                    {src.url}
                  </a>
                  <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-500 self-start text-xs">
                    {src.type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add News Source</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Sources added here are active immediately until container restart. To make them permanent, add them to
              language source files.
            </p>

            <form onSubmit={handleAddSource} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Source Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Times of India"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Language</label>
                  <select
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l} value={l}>
                        {l.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="rss">RSS</option>
                  <option value="web">Web</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Feed URL</label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/rss/feed.xml"
                  type="url"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {addError && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {addError}
                </p>
              )}
              {addSuccess && (
                <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                  {addSuccess}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-ghost text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={adding} className="flex-1 btn-primary text-sm">
                  {adding ? 'Adding...' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

