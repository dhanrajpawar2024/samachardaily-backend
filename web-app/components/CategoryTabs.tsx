import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';

interface Props { activeCategory: string; lang: string }

export function CategoryTabs({ activeCategory, lang }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map(cat => (
        <Link
          key={cat.slug}
          href={`/?lang=${lang}&category=${cat.slug}`}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium
                      whitespace-nowrap transition-all duration-150
            ${activeCategory === cat.slug
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </Link>
      ))}
    </div>
  );
}

