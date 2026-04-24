'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';

interface Props { title: string; url: string }

export function ShareButton({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300
                 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <Share2 size={15} />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}

