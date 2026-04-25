'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { AdPlacement } from '@/lib/api';

interface Props {
  ad?: AdPlacement | null;
  className?: string;
}

export function AdSlot({ ad, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => ad?.html_snippet || '', [ad?.html_snippet]);

  useEffect(() => {
    if (!ad || ad.placement_type !== 'script' || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = html;

    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const script = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
      script.text = oldScript.text || oldScript.textContent || '';
      oldScript.replaceWith(script);
    });
  }, [ad, html]);

  if (!ad || !ad.is_active) return null;

  if (ad.placement_type === 'image' && ad.image_url) {
    const image = (
      <img
        src={ad.image_url}
        alt={ad.name || 'Advertisement'}
        className="mx-auto max-h-48 w-auto max-w-full rounded-md object-contain"
        loading="lazy"
      />
    );

    return (
      <aside className={`ad-slot ${className}`} aria-label="Advertisement">
        {ad.target_url ? (
          <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored">
            {image}
          </a>
        ) : image}
      </aside>
    );
  }

  if (ad.placement_type === 'ad_unit') {
    return (
      <aside className={`ad-slot ${className}`} aria-label="Advertisement">
        <div className="text-xs uppercase tracking-wide text-slate-400">Advertisement</div>
        <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{ad.ad_unit_id}</div>
      </aside>
    );
  }

  return (
    <aside className={`ad-slot ${className}`} aria-label="Advertisement">
      <div ref={containerRef} />
    </aside>
  );
}
