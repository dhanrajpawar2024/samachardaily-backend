'use client';

import { formatDistanceToNow } from 'date-fns';
import { Eye, Play } from 'lucide-react';
import { useState } from 'react';
import type { Video } from '@/lib/api';

interface Props {
  videos: Video[];
}

/** Extract 11-char YouTube video ID from any YouTube URL */
function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractVideoId(video.video_url);
  const thumbnail = video.thumbnail_url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

  const publishedDate = video.published_at ? new Date(video.published_at) : null;
  const timeAgo = publishedDate && !isNaN(publishedDate.getTime())
    ? formatDistanceToNow(publishedDate, { addSuffix: true })
    : 'recently';

  return (
    <div className="group rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm
                    hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700">
      {/* Video / Thumbnail area */}
      <div className="relative aspect-video bg-slate-900">
        {playing && videoId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            )}
            {/* Play button overlay */}
            <button
              onClick={() => setPlaying(true)}
              aria-label="Play video"
              className="absolute inset-0 flex items-center justify-center
                         bg-black/30 group-hover:bg-black/40 transition-colors"
            >
              <span className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center
                               shadow-lg group-hover:scale-105 transition-transform">
                <Play size={22} className="text-white ml-1" fill="white" />
              </span>
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
          {video.title}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-500 dark:text-slate-400 truncate max-w-[60%]">
            {video.author_name}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {video.view_count.toLocaleString()}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{timeAgo}</p>
      </div>
    </div>
  );
}

export function VideoGrid({ videos }: Props) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Play size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">No videos yet</p>
        <p className="text-sm mt-1">Videos are scraped from Indian news channels — check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
