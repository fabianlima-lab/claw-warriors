'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { SUPPORT_CATEGORIES, SUPPORT_ARTICLES, getArticlesByCategory } from '@/lib/support-articles';

const CATEGORY_KEYS = {
  'getting-started': 'categoryGettingStarted',
  features: 'categoryFeatures',
  account: 'categoryAccount',
  troubleshooting: 'categoryTroubleshooting',
};

export default function SupportHub() {
  const t = useTranslations('Support');
  const [search, setSearch] = useState('');

  const filteredArticles = search.trim()
    ? SUPPORT_ARTICLES.filter((a) => {
        const title = t(a.titleKey).toLowerCase();
        return title.includes(search.toLowerCase());
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-txt">
          {t('hubTitle')}
        </h1>
        <p className="text-txt-muted">{t('hubSubtitle')}</p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full bg-card border border-border rounded-[var(--radius-btn)] px-4 py-3 text-sm text-txt-body outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Search results */}
      {filteredArticles ? (
        filteredArticles.length === 0 ? (
          <p className="text-center text-txt-dim">{t('noResults')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredArticles.map((article) => (
              <Link key={article.slug} href={`/support/${article.slug}`}>
                <Card className="p-4 hover:border-accent transition-colors cursor-pointer h-full">
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{article.icon}</span>
                    <div>
                      <h3 className="text-sm font-medium text-txt">{t(article.titleKey)}</h3>
                      <p className="text-xs text-txt-dim mt-1 capitalize">{t(CATEGORY_KEYS[article.category])}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )
      ) : (
        /* Category sections */
        <div className="space-y-8">
          {SUPPORT_CATEGORIES.map((category) => {
            const articles = getArticlesByCategory(category.key);
            return (
              <div key={category.key}>
                <h2 className="font-[family-name:var(--font-display)] text-lg text-txt flex items-center gap-2 mb-4">
                  <span>{category.icon}</span>
                  {t(CATEGORY_KEYS[category.key])}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {articles.map((article) => (
                    <Link key={article.slug} href={`/support/${article.slug}`}>
                      <Card className="p-4 hover:border-accent transition-colors cursor-pointer h-full">
                        <div className="flex items-start gap-3">
                          <span className="text-lg shrink-0">{article.icon}</span>
                          <h3 className="text-sm font-medium text-txt">{t(article.titleKey)}</h3>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Back to dashboard */}
      <div className="text-center pt-4">
        <Link href="/dashboard" className="text-sm text-accent hover:underline">
          {t('backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
