import Link from 'next/link';
import { LANGUAGES } from '@/lib/constants';

export function LanguageSelector({ activeLang, basePath = '/' }: { activeLang: string; basePath?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {LANGUAGES.map(lang => (
        <Link
          key={lang.code}
          href={`${basePath}?lang=${lang.code}`}
          className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium
                      whitespace-nowrap transition-all min-w-[56px]
            ${activeLang === lang.code
              ? 'bg-brand-500 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          <span className="text-lg leading-tight">{getLangEmoji(lang.code)}</span>
          <span>{lang.nativeLabel}</span>
        </Link>
      ))}
    </div>
  );
}

function getLangEmoji(code: string) {
  const map: Record<string, string> = {
    en: '🇬🇧', hi: '🇮🇳', te: '🔱', ta: '🌺', kn: '🐘', mr: '🦁', bn: '🐯', gu: '🦚', pa: '🌾', ml: '🌴',
  };
  return map[code] || '🌐';
}

