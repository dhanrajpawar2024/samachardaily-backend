import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Megaphone, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import {
  createAd,
  deleteAd,
  getAds,
  toggleAd,
  updateAd,
  type AdPayload,
  type AdPlacement,
} from '../lib/api';
import clsx from 'clsx';

const POSITIONS = [
  'home_top',
  'feed_after_4',
  'feed_after_8',
  'article_inline',
  'article_bottom',
  'sidebar_top',
];

const PROVIDERS = ['google', 'meta', 'custom', 'direct'];
const LANGUAGES = ['', 'en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'pa', 'ml'];

const EMPTY_FORM: AdPayload = {
  position_key: 'feed_after_4',
  name: '',
  provider: 'google',
  placement_type: 'script',
  article_id_after: 4,
  ad_unit_id: '',
  html_snippet: '',
  image_url: '',
  target_url: '',
  language: null,
  is_active: true,
  sort_order: 0,
};

export function Ads() {
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdPlacement | null>(null);
  const [form, setForm] = useState<AdPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const activeCount = useMemo(() => ads.filter(ad => ad.is_active).length, [ads]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAds();
      setAds(res.ads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (ad: AdPlacement) => {
    setEditing(ad);
    setForm({
      position_key: ad.position_key,
      name: ad.name,
      provider: ad.provider,
      placement_type: ad.placement_type,
      article_id_after: ad.article_id_after ?? null,
      ad_unit_id: ad.ad_unit_id ?? '',
      html_snippet: ad.html_snippet ?? '',
      image_url: ad.image_url ?? '',
      target_url: ad.target_url ?? '',
      language: ad.language ?? null,
      is_active: ad.is_active,
      sort_order: ad.sort_order,
    });
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editing) {
        await updateAd(editing.id, form);
        setMessage('Ad placement updated');
      } else {
        await createAd(form);
        setMessage('Ad placement created');
      }
      await load();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ad');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (ad: AdPlacement) => {
    await toggleAd(ad.id, !ad.is_active);
    await load();
  };

  const handleDelete = async (ad: AdPlacement) => {
    if (!confirm(`Delete "${ad.name}"?`)) return;
    await deleteAd(ad.id);
    await load();
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ad Placements</h2>
          <p className="text-sm text-slate-500">
            {activeCount} active of {ads.length} placements. Third-party ad code is managed here only.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary text-sm">
            <Plus size={14} /> Add Ad
          </button>
        </div>
      </div>

      {(message || error) && (
        <div className={clsx(
          'p-3 rounded-lg text-sm',
          error
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        )}>
          {error || message}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="table-cell">Placement</th>
                <th className="table-cell">Provider</th>
                <th className="table-cell">Type</th>
                <th className="table-cell">Language</th>
                <th className="table-cell">Status</th>
                <th className="table-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="table-cell text-slate-400">Loading ads...</td></tr>
              ) : ads.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-slate-400">No ad placements configured.</td></tr>
              ) : ads.map(ad => (
                <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                        <Megaphone size={17} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-100">{ad.name}</p>
                        <p className="text-xs text-slate-400">{ad.position_key}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell capitalize">{ad.provider}</td>
                  <td className="table-cell">
                    <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {ad.placement_type}
                    </span>
                  </td>
                  <td className="table-cell">{ad.language ? ad.language.toUpperCase() : 'All'}</td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleToggle(ad)}
                      className={clsx(
                        'inline-flex items-center gap-1 text-sm font-medium',
                        ad.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-400'
                      )}
                    >
                      {ad.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {ad.is_active ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(ad)} className="btn-ghost text-xs py-1.5">Edit</button>
                      <button onClick={() => handleDelete(ad)} className="btn-ghost text-xs py-1.5 text-red-600">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editing ? 'Edit Ad Placement' : 'Add Ad Placement'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Field>
                <Field label="Position Key">
                  <input
                    className="input"
                    list="ad-positions"
                    value={form.position_key}
                    onChange={e => setForm(f => ({ ...f, position_key: e.target.value }))}
                  />
                  <datalist id="ad-positions">
                    {POSITIONS.map(p => <option key={p} value={p} />)}
                  </datalist>
                </Field>
              </div>

              <div className="grid sm:grid-cols-4 gap-3">
                <Field label="Provider">
                  <select className="input" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Type">
                  <select
                    className="input"
                    value={form.placement_type}
                    onChange={e => setForm(f => ({ ...f, placement_type: e.target.value as AdPayload['placement_type'] }))}
                  >
                    <option value="script">Script / HTML</option>
                    <option value="image">Image Link</option>
                    <option value="ad_unit">Ad Unit ID</option>
                  </select>
                </Field>
                <Field label="Language">
                  <select className="input" value={form.language || ''} onChange={e => setForm(f => ({ ...f, language: e.target.value || null }))}>
                    {LANGUAGES.map(l => <option key={l || 'all'} value={l}>{l ? l.toUpperCase() : 'All'}</option>)}
                  </select>
                </Field>
                <Field label="Sort">
                  <input
                    className="input"
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Ad Unit ID">
                  <input className="input" value={form.ad_unit_id || ''} onChange={e => setForm(f => ({ ...f, ad_unit_id: e.target.value }))} />
                </Field>
                <Field label="Feed Insert After">
                  <input
                    className="input"
                    type="number"
                    value={form.article_id_after ?? ''}
                    onChange={e => setForm(f => ({ ...f, article_id_after: e.target.value ? Number(e.target.value) : null }))}
                  />
                </Field>
              </div>

              {form.placement_type === 'image' ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Image URL">
                    <input className="input" type="url" value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                  </Field>
                  <Field label="Target URL">
                    <input className="input" type="url" value={form.target_url || ''} onChange={e => setForm(f => ({ ...f, target_url: e.target.value }))} />
                  </Field>
                </div>
              ) : (
                <Field label="Third-party HTML / Script Snippet">
                  <textarea
                    className="input min-h-[180px] font-mono text-xs"
                    value={form.html_snippet || ''}
                    onChange={e => setForm(f => ({ ...f, html_snippet: e.target.value }))}
                    placeholder="<ins class='adsbygoogle' ...></ins><script>...</script>"
                  />
                </Field>
              )}

              <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                />
                Active
              </label>

              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-ghost text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm">
                  {saving ? 'Saving...' : 'Save Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</span>
      {children}
    </label>
  );
}
