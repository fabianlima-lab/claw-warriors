'use client';

import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { getArticleBySlug, SUPPORT_ARTICLES, getArticlesByCategory } from '@/lib/support-articles';

export default function SupportArticlePage() {
  const params = useParams();
  const t = useTranslations('Support');
  const slug = params.slug;

  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center space-y-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-txt">
          Article Not Found
        </h1>
        <Link href="/support" className="text-sm text-accent hover:underline">
          {t('backToHub')}
        </Link>
      </div>
    );
  }

  // Get related articles (same category, excluding current)
  const related = getArticlesByCategory(article.category)
    .filter((a) => a.slug !== slug)
    .slice(0, 3);

  // Format body text with paragraph breaks
  const bodyText = t(article.bodyKey);
  const paragraphs = bodyText.split('\n\n');

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      {/* Back link */}
      <Link href="/support" className="text-sm text-accent hover:underline">
        {t('backToHub')}
      </Link>

      {/* Article */}
      <article>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{article.icon}</span>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-txt">
            {t(article.titleKey)}
          </h1>
        </div>

        <div className="space-y-4 text-sm text-txt-body leading-relaxed">
          {paragraphs.map((paragraph, i) => {
            // Check if paragraph looks like a list (starts with - or numbered)
            const lines = paragraph.split('\n');
            const isList = lines.every((line) => line.match(/^[-•\d]+[.)]\s/) || line.trim() === '');

            if (isList) {
              return (
                <ul key={i} className="space-y-1.5 pl-4">
                  {lines.filter((l) => l.trim()).map((line, j) => (
                    <li key={j} className="list-disc text-txt-body">
                      {line.replace(/^[-•]\s*/, '').replace(/^\d+[.)]\s*/, '')}
                    </li>
                  ))}
                </ul>
              );
            }

            // Check if paragraph has inline line breaks (sub-sections)
            if (lines.length > 1) {
              return (
                <div key={i} className="space-y-1">
                  {lines.map((line, j) => {
                    // Detect headings-like lines (short, no punctuation at end)
                    const isHeading = line.length < 60 && !line.endsWith('.') && !line.endsWith(':') && !line.startsWith('-') && !line.startsWith('•') && line.trim().length > 0;
                    const isListItem = line.startsWith('- ') || line.startsWith('• ');

                    if (isListItem) {
                      return (
                        <p key={j} className="pl-4 text-txt-body">
                          <span className="text-accent mr-1">•</span>
                          {line.replace(/^[-•]\s*/, '')}
                        </p>
                      );
                    }

                    if (isHeading && j > 0) {
                      return (
                        <p key={j} className="font-medium text-txt mt-3">{line}</p>
                      );
                    }

                    return <p key={j}>{line}</p>;
                  })}
                </div>
              );
            }

            return <p key={i}>{paragraph}</p>;
          })}
        </div>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-txt-muted uppercase tracking-wider mb-3">
            Related Articles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/support/${r.slug}`}>
                <Card className="p-3 hover:border-accent transition-colors cursor-pointer h-full">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.icon}</span>
                    <span className="text-xs font-medium text-txt">{t(r.titleKey)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back to dashboard */}
      <div className="text-center pt-2">
        <Link href="/dashboard" className="text-sm text-accent hover:underline">
          {t('backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
