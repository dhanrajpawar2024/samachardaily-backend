import { getTrending, getFeed } from '@/lib/api';
import { CategoryTabs } from '@/components/CategoryTabs';
import { LanguageSelector } from '@/components/LanguageSelector';
import { HomeFeedClient } from '@/components/HomeFeedClient';

interface HomeProps {
  searchParams: Promise<{ lang?: string; category?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { lang: rawLang, category: rawCategory, page: rawPage } = await searchParams;
  const lang     = rawLang     || 'en';
  const category = rawCategory || 'top-stories';
  const page     = Number(rawPage || 1);

  const [trendingResult, feedResult] = await Promise.allSettled([
    getTrending(lang, 8),
    getFeed({ language: lang, category, page, limit: 20 }),
  ]);

  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [];
  const feed     = feedResult.status     === 'fulfilled' ? feedResult.value     : { articles: [], pagination: { page: 1, limit: 20, total: 0 } };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Language Selector */}
      <LanguageSelector activeLang={lang} />

      {/* Category Tabs + Feed */}
      <CategoryTabs activeCategory={category} lang={lang} />
      <HomeFeedClient trending={trending} feed={feed} lang={lang} category={category} />
    </div>
  );
}

