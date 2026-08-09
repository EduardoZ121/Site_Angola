'use client';

import { useLocale } from '@/modules/i18n/LocaleProvider';
import { experienceLabel } from '@/modules/i18n/experience-labels';
import type { ExperienceMode } from '../role-experience';
import { operatingProfileFor } from '../role-operating-matrix';

/**
 * Shows mission / may / may-not for the active experience — operational identity.
 */
export function RoleMissionPanel({ mode }: { mode: ExperienceMode }) {
  const { locale } = useLocale();
  const profile = operatingProfileFor(mode);

  return (
    <section
      className="kuteka-detail-panel border-l-4 border-l-[#c45c26] p-4"
      aria-labelledby="role-mission-heading"
    >
      <p className="kuteka-detail-eyebrow">Missão operacional</p>
      <h2 id="role-mission-heading" className="text-base font-semibold text-slate-900">
        {experienceLabel(mode, locale)}
      </h2>
      <p className="mt-1 text-sm text-slate-700">{profile.mission}</p>
      <p className="mt-2 text-xs text-slate-500">
        Reporta a: <strong className="text-slate-700">{profile.reportsTo}</strong>
        {' · '}
        {profile.cockpitHint}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-kuteka border border-emerald-200 bg-emerald-50/60 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">Pode / deve</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-emerald-950">
            {profile.mustDo.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-kuteka border border-rose-200 bg-rose-50/60 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-rose-900">Não deve</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-rose-950">
            {profile.mustNot.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
