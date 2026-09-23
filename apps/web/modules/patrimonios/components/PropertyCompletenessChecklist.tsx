'use client';

import {
  PROPERTY_COMPLETENESS_LABELS_PT,
  propertyCompleteness,
  type PropertyCompletenessInput,
  type PropertyCompletenessItemId,
} from '../lib/property-completeness';

type PropertyCompletenessChecklistProps = {
  row: PropertyCompletenessInput;
  mediaCount?: number;
  className?: string;
};

export function PropertyCompletenessChecklist({
  row,
  mediaCount,
  className,
}: PropertyCompletenessChecklistProps) {
  const result = propertyCompleteness({
    ...row,
    media_count: mediaCount ?? row.media_count,
  });

  return (
    <section
      className={className ?? 'kuteka-detail-panel flex flex-col gap-3 p-4'}
      aria-labelledby="property-completeness-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="property-completeness-heading" className="text-sm font-semibold text-stone-800">
          Completude do património
        </h2>
        <p className="font-mono text-sm tabular-nums text-stone-600">{result.percent}%</p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-stone-200"
        role="progressbar"
        aria-valuenow={result.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out"
          style={{ width: `${result.percent}%` }}
        />
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {(
          [
            'photos',
            'characteristics',
            'docs',
            'identity',
            'purpose',
            'activation_request',
          ] as PropertyCompletenessItemId[]
        ).map((id) => {
          const done = result.done.includes(id);
          return (
            <li key={id} className={done ? 'text-sm text-emerald-800' : 'text-sm text-stone-600'}>
              <span aria-hidden="true">{done ? '✓ ' : '○ '}</span>
              {PROPERTY_COMPLETENESS_LABELS_PT[id]}
              {!done ? <span className="text-stone-400"> — pendente</span> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
