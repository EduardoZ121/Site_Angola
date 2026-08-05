'use client';

import Link from 'next/link';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getOpsCopy } from '../content';
import type { KaiInsight } from '../types';

const TONE_CLASS: Record<KaiInsight['tone'], string> = {
  info: 'kuteka-kai-card kuteka-kai-card--info',
  warn: 'kuteka-kai-card kuteka-kai-card--warn',
  success: 'kuteka-kai-card kuteka-kai-card--success',
  predict: 'kuteka-kai-card kuteka-kai-card--predict',
};

export function KaiInsightCards({ insights }: { insights: KaiInsight[] }) {
  const { locale } = useLocale();
  const c = getOpsCopy(locale).kai;
  if (!insights.length) return null;

  return (
    <section className="kuteka-detail-panel p-5" aria-label={c.aria}>
      <p className="kuteka-detail-eyebrow">{c.eyebrow}</p>
      <h2 className="kuteka-detail-title mt-1">{c.title}</h2>
      <p className="kuteka-detail-body mt-1">{c.subtitle}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {insights.map((insight) => {
          const inner = (
            <>
              <p className="kuteka-kai-card__title">{insight.title}</p>
              <p className="kuteka-kai-card__body">{insight.body}</p>
            </>
          );
          return (
            <li key={insight.id} className={TONE_CLASS[insight.tone]}>
              {insight.href ? (
                <Link href={insight.href} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
