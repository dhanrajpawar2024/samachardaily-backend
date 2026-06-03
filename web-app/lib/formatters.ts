const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

export const getCleanSummary = (title: string, summary?: string, content?: string) => {
  const primary = stripHtml(summary || '');
  const fallback = stripHtml(content || '');
  let candidate = primary || fallback;
  if (!candidate) return '';

  const normalizedTitle = stripHtml(title).toLowerCase();
  const normalizedCandidate = candidate.toLowerCase();

  if (normalizedCandidate.startsWith(normalizedTitle)) {
    candidate = candidate.slice(normalizedTitle.length).replace(/^\s*[-:|,.]+\s*/, '').trim();
  }

  if (!candidate) return '';
  return candidate.length > 220 ? `${candidate.slice(0, 217)}...` : candidate;
};

export const formatRelativeTime = (publishedAt?: string) => {
  if (!publishedAt) return 'Just now';
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < minute) return 'Just now';
  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), 'minute');
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), 'hour');

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return rtf.format(Math.round(diffMs / day), 'day');
};

export const getSourceInitials = (sourceName: string) => {
  const parts = (sourceName || 'Source').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};
