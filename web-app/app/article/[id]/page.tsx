import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticle, getTrending } from '@/lib/api';
import { ArticleCard } from '@/components/ArticleCard';
import { ShareButton } from '@/components/ShareButton';
import { RemoteImage } from '@/components/RemoteImage';
import { formatDistanceToNow } from 'date-fns';
import { Clock, ExternalLink, Eye } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const article = await getArticle(id);
    return {
      title: article.title,
      description: article.summary,
      openGraph: {
        title: article.title,
        description: article.summary,
        images: article.thumbnail_url ? [article.thumbnail_url] : [],
        type: 'article',
        publishedTime: article.published_at,
      },
    };
  } catch {
    return { title: 'Article' };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  let article;
  try {
    article = await getArticle(id);
  } catch {
    notFound();
  }

  const related = await getTrending(article.language, 4).catch(() => []);

  const publishedDate = article.published_at ? new Date(article.published_at) : null;
  const timeAgo = publishedDate && !isNaN(publishedDate.getTime())
    ? formatDistanceToNow(publishedDate, { addSuffix: true })
    : 'recently';
  const bodyText = article.content || article.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main Article ─────────────────────── */}
        <article className="lg:col-span-2 space-y-6">

          {/* Breadcrumb */}
          <nav className="text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-brand-500">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800 dark:text-slate-200">{article.source_name}</span>
          </nav>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="badge bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">
              {article.source_name}
            </span>
            {article.author && (
              <span className="font-medium text-slate-700 dark:text-slate-300">
                By {article.author}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={13} /> {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={13} /> {(article.view_count ?? 0).toLocaleString()} views
            </span>
          </div>

          {/* Hero Image */}
          {article.thumbnail_url && (
            <div className="relative w-full h-64 sm:h-96 rounded-xl overflow-hidden">
              <RemoteImage
                src={article.thumbnail_url}
                alt={article.title}
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-base prose-p:leading-relaxed">
            {bodyText ? (
              bodyText.split('\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))
            ) : (
              <p className="text-slate-500 italic">Full article content not available.</p>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <ShareButton title={article.title} url={article.source_url} />
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 btn-primary"
            >
              <ExternalLink size={15} /> Read on {article.source_name}
            </a>
          </div>
        </article>

        {/* ── Sidebar: Related ─────────────────── */}
        <aside className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            🔥 Trending in {article.language.toUpperCase()}
          </h3>
          {related.filter(r => r.id !== article.id).slice(0, 4).map(r => (
            <ArticleCard key={r.id} article={r} compact />
          ))}
        </aside>
      </div>
    </div>
  );
}

