import { getVideos } from '@/lib/api';
import { LanguageSelector } from '@/components/LanguageSelector';
import { VideoGrid } from '@/components/VideoGrid';
import { Play } from 'lucide-react';

interface VideosPageProps {
  searchParams: Promise<{ lang?: string; page?: string }>;
}

export const metadata = {
  title: 'Videos — SamacharDaily',
  description: 'Watch the latest Indian news videos in your language.',
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const { lang: rawLang, page: rawPage } = await searchParams;
  const lang = rawLang || 'en';
  const page = Number(rawPage || 1);

  const result = await getVideos({ language: lang, page, limit: 24 }).catch(() => ({
    videos: [],
    pagination: { page: 1, limit: 24, total: 0, total_pages: 1 },
  }));

  const { videos, pagination } = result;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
          <Play size={22} className="text-red-600 dark:text-red-400" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">News Videos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Latest clips from Indian news channels
            {pagination.total > 0 && ` · ${pagination.total.toLocaleString()} videos`}
          </p>
        </div>
      </div>

      {/* Language Selector */}
      <LanguageSelector activeLang={lang} basePath="/videos" />

      {/* Video Grid */}
      <VideoGrid videos={videos} />

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <a
              href={`/videos?lang=${lang}&page=${page - 1}`}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700
                         dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
            >
              ← Previous
            </a>
          )}
          <span className="text-sm text-slate-500">
            Page {page} of {pagination.total_pages}
          </span>
          {page < pagination.total_pages && (
            <a
              href={`/videos?lang=${lang}&page=${page + 1}`}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700
                         dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
