import { useEffect, useState } from 'react';
import { Newspaper, Rss, Activity, Users, RefreshCw, Play, Trash2, TrendingUp } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import {
  getScraperHealth, getScraperStats, triggerScrape, triggerTrending, triggerCleanup,
  type ScraperHealth, type ScraperStats,
} from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

type JobStatus = 'idle' | 'running' | 'success' | 'error';

export function Dashboard() {
  const [health,   setHealth]   = useState<ScraperHealth | null>(null);
  const [stats,    setStats]    = useState<ScraperStats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [scrapeStatus,  setScrapeStatus]  = useState<JobStatus>('idle');
  const [trendStatus,   setTrendStatus]   = useState<JobStatus>('idle');
  const [cleanStatus,   setCleanStatus]   = useState<JobStatus>('idle');

  const load = async () => {
    setLoading(true);
    const [h, s] = await Promise.allSettled([getScraperHealth(), getScraperStats()]);
    if (h.status === 'fulfilled') setHealth(h.value);
    if (s.status === 'fulfilled') setStats(s.value);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runJob = async (
    fn: () => Promise<unknown>,
    setStatus: (s: JobStatus) => void
  ) => {
    setStatus('running');
    try { await fn(); setStatus('success'); setTimeout(() => { setStatus('idle'); load(); }, 3000); }
    catch { setStatus('error'); setTimeout(() => setStatus('idle'), 3000); }
  };

  const lastRun = health?.last_run;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Scraper & content overview</p>
        </div>
        <button onClick={load} disabled={loading}
          className="btn-ghost text-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Sources"  value={health?.sources ?? '—'} icon={Rss}       color="orange" />
        <StatsCard title="Languages"      value={health?.languages?.length ?? '—'} icon={Activity} color="blue" />
        <StatsCard title="Last Ingested"  value={lastRun?.ingested ?? '—'}
          subtitle={lastRun ? `${lastRun.duration_seconds}s ago` : undefined} icon={Newspaper} color="green" />
        <StatsCard title="Status"
          value={health?.status === 'healthy' ? '✅ Healthy' : '❌ Down'}
          icon={Activity} color={health?.status === 'healthy' ? 'green' : 'red'} />
      </div>

      {/* Service Status + Last Run */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service health */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Services</h3>
          {[
            { name: 'Scraper Service',  port: 3007, ok: !!health },
            { name: 'API Gateway',      port: 3000, ok: true     },
            { name: 'Feed Service',     port: 3003, ok: true     },
          ].map(svc => (
            <div key={svc.name} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-slate-600 dark:text-slate-300">{svc.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">:{svc.port}</span>
                <span className={clsx('w-2.5 h-2.5 rounded-full', svc.ok ? 'bg-green-500' : 'bg-red-500')} />
              </div>
            </div>
          ))}
        </div>

        {/* Last Run */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Last Scrape Run</h3>
          {lastRun ? (
            <>
              <p className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(lastRun.timestamp), { addSuffix: true })}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Articles Ingested', value: lastRun.ingested },
                  { label: 'Duration',          value: `${lastRun.duration_seconds}s` },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 italic">No runs yet</p>
          )}
        </div>
      </div>

      {/* Manual Job Triggers */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Manual Job Triggers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <JobButton
            label="Run Scraper Now" icon={Play} status={scrapeStatus}
            onClick={() => runJob(triggerScrape, setScrapeStatus)}
            description="Fetch all 145 RSS sources" />
          <JobButton
            label="Recalculate Trending" icon={TrendingUp} status={trendStatus}
            onClick={() => runJob(triggerTrending, setTrendStatus)}
            description="Update trending scores" />
          <JobButton
            label="Run Cleanup" icon={Trash2} status={cleanStatus}
            onClick={() => runJob(triggerCleanup, setCleanStatus)}
            description="Archive stale articles" variant="danger" />
        </div>
      </div>

      {/* Language Breakdown */}
      {health?.languages && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Active Languages</h3>
          <div className="flex flex-wrap gap-2">
            {health.languages.map(lang => (
              <span key={lang} className="badge bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-3 py-1">
                {lang.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JobButton({ label, icon: Icon, status, onClick, description, variant = 'default' }: {
  label: string; icon: typeof Play; status: JobStatus;
  onClick: () => void; description: string; variant?: 'default' | 'danger';
}) {
  const isRunning = status === 'running';
  return (
    <button onClick={onClick} disabled={isRunning}
      className={clsx(
        'flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left',
        status === 'success' ? 'border-green-400 bg-green-50 dark:bg-green-900/20' :
        status === 'error'   ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
        variant === 'danger' ? 'border-red-200 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' :
        'border-slate-200 dark:border-slate-600 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
      )}>
      <Icon size={20} className={clsx(
        isRunning ? 'animate-spin' : '',
        variant === 'danger' ? 'text-red-500' : 'text-brand-500'
      )} />
      <div>
        <p className="font-medium text-sm text-slate-700 dark:text-slate-200">
          {status === 'success' ? '✅ Done!' : status === 'error' ? '❌ Failed' : label}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </button>
  );
}

