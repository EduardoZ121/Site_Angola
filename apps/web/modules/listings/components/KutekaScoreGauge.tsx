'use client';

import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getListingsCopy } from '../content';

type KutekaScoreGaugeProps = {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  statusGood?: string;
  statusFair?: string;
  statusAttention?: string;
};

function tone(
  score: number,
  statuses: { good: string; fair: string; attention: string },
): { stroke: string; text: string; status: string } {
  if (score >= 80) return { stroke: '#15803d', text: 'text-emerald-800', status: statuses.good };
  if (score >= 60) return { stroke: '#ca8a04', text: 'text-amber-800', status: statuses.fair };
  return { stroke: '#c2410c', text: 'text-orange-900', status: statuses.attention };
}

/** Circular Índice Kuteka gauge — shared by PDK + Health cockpit. */
export function KutekaScoreGauge({
  score,
  size = 'md',
  label,
  statusGood,
  statusFair,
  statusAttention,
}: KutekaScoreGaugeProps) {
  const { locale } = useLocale();
  const gauge = getListingsCopy(locale).gauge;
  const resolvedLabel = label ?? gauge.label;
  const value =
    score != null && !Number.isNaN(Number(score))
      ? Math.max(0, Math.min(100, Number(score)))
      : null;
  const dims = size === 'lg' ? 140 : size === 'sm' ? 72 : 108;
  const stroke = size === 'lg' ? 10 : size === 'sm' ? 6 : 8;
  const r = (dims - stroke) / 2;
  const c = 2 * Math.PI * r;
  const t = tone(value ?? 0, {
    good: statusGood ?? gauge.statusGood,
    fair: statusFair ?? gauge.statusFair,
    attention: statusAttention ?? gauge.statusAttention,
  });
  const offset = value == null ? c : c - (value / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg
          width={dims}
          height={dims}
          viewBox={`0 0 ${dims} ${dims}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke="rgba(8,38,63,0.12)"
            strokeWidth={stroke}
          />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke={value == null ? 'rgba(8,38,63,0.2)' : t.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            className={`font-mono font-bold leading-none text-[#08263f] ${size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'}`}
          >
            {value != null ? Math.round(value) : '—'}
          </p>
          <p className="mt-0.5 text-[0.65rem] font-semibold text-slate-500">/100</p>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {resolvedLabel}
        </p>
        {value != null ? (
          <p className={`mt-0.5 text-sm font-semibold ${t.text}`}>{t.status}</p>
        ) : null}
      </div>
    </div>
  );
}
