import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { LANGUAGES, CATEGORIES } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-brand-600 dark:text-brand-400 mb-3">
              <Newspaper size={20} /> SamacharDaily
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              India's multilingual news platform. News in your language, delivered fresh.
            </p>
          </div>

          {/* Languages */}
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Languages</h4>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <Link key={l.code} href={`/?lang=${l.code}`}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
                  {l.nativeLabel}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Categories</h4>
            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map(c => (
                <Link key={c.slug} href={`/?category=${c.slug}`}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
                  {c.icon} {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 text-center
                        text-xs text-slate-400">
          © {new Date().getFullYear()} SamacharDaily. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

