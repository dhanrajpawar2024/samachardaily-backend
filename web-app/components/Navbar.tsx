'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, Moon, Sun, Menu, X, Newspaper } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, Suspense } from 'react';
import { LANGUAGES } from '@/lib/constants';

function NavContent() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLang = searchParams.get('lang') || 'en';

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md
                       border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400">
            <Newspaper size={22} />
            <span>SamacharDaily</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {LANGUAGES.slice(0, 6).map(lang => (
              <Link
                key={lang.code}
                href={`/?lang=${lang.code}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${activeLang === lang.code
                    ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {lang.nativeLabel}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/search"
              className="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100
                         dark:hover:bg-slate-800 transition-colors">
              <Search size={18} />
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100
                         dark:hover:bg-slate-800 transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen(v => !v)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            {LANGUAGES.map(lang => (
              <Link
                key={lang.code}
                href={`/?lang=${lang.code}`}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${activeLang === lang.code
                    ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {lang.nativeLabel}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense>
      <NavContent />
    </Suspense>
  );
}

