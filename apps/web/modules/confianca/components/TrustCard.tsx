'use client';

import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getConfiancaCopy } from '../content';
import {
  formatAvgResponse,
  formatContractsCompleted,
  formatDateShort,
  formatIck,
  formatKisLevel,
  formatRatingSummary,
} from '../lib/trust-format';

export type TrustCardProps = {
  title?: string;
  /** Índice Kuteka 0-100. */
  ick?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  contractsCompleted?: number | null;
  avgResponseMinutes?: number | null;
  kisLevel?: number | null;
  memberSince?: string | null;
  lastActivityAt?: string | null;
  compact?: boolean;
  /** Short KAI reputation hints — rendered under the card when present. */
  kaiHints?: string[];
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="kuteka-detail-label">{label}</dt>
      <dd className="kuteka-detail-value font-mono">{value}</dd>
    </div>
  );
}

/**
 * Trust Card — single, compact reputation summary shared across property
 * detail, cards and profile. Never buried: ICK, stars, contracts, response
 * time, KIS level, tenure and last activity in one glass panel.
 */
export function TrustCard({
  title,
  ick,
  ratingAvg,
  ratingCount,
  contractsCompleted,
  avgResponseMinutes,
  kisLevel,
  memberSince,
  lastActivityAt,
  compact = false,
  kaiHints,
}: TrustCardProps) {
  const { locale } = useLocale();
  const copy = getConfiancaCopy(locale).trustCard;

  const stats: { label: string; value: string }[] = [
    { label: copy.ickLabel, value: formatIck(ick) },
    {
      label: copy.ratingLabel,
      value: formatRatingSummary(ratingAvg, ratingCount, copy, locale),
    },
    { label: copy.contractsLabel, value: formatContractsCompleted(contractsCompleted) },
    { label: copy.avgResponseLabel, value: formatAvgResponse(avgResponseMinutes, copy) },
    { label: copy.kisLevelLabel, value: formatKisLevel(kisLevel, copy) },
    { label: copy.memberSinceLabel, value: formatDateShort(memberSince, locale) },
    { label: copy.lastActivityLabel, value: formatDateShort(lastActivityAt, locale) },
  ];

  return (
    <section
      className={compact ? 'kuteka-detail-review p-3' : 'kuteka-detail-panel p-5 sm:p-6'}
      aria-label={title ?? copy.title}
    >
      {!compact ? (
        <p className="kuteka-detail-eyebrow">{title ?? copy.title}</p>
      ) : title ? (
        <p className="kuteka-detail-label">{title}</p>
      ) : null}
      <dl
        className={
          compact
            ? 'mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4'
            : 'mt-3 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4'
        }
      >
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </dl>
      {kaiHints && kaiHints.length > 0 ? (
        <div className="mt-4 border-t border-[var(--kuteka-detail-line)] pt-3">
          <p className="kuteka-detail-label">{copy.kaiTitle}</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {kaiHints.map((hint) => (
              <li key={hint} className="kuteka-detail-body text-sm">
                {hint}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
