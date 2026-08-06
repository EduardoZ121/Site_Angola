'use client';

import type { IdentityPartySnapshot } from '@kuteka/types';
import { Badge } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getIdentidadeCopy } from '../content';
import { KYC_LEVEL_LABELS, type KycLevel } from '../lib/kyc';

type KisPartyReadonlyProps = {
  snapshot: IdentityPartySnapshot | null;
  title: string;
};

export function KisPartyReadonly({ snapshot, title }: KisPartyReadonlyProps) {
  const { locale } = useLocale();
  const copy = getIdentidadeCopy(locale);
  const level = (snapshot?.kycLevel ?? 0) as KycLevel;
  const legalName =
    snapshot?.legalFullName || snapshot?.preferredName || snapshot?.displayName || null;

  return (
    <section className="kuteka-detail-panel p-4" aria-label={title}>
      <p className="kuteka-detail-eyebrow">{title}</p>
      <p className="mt-1 text-xs text-stone-700">{copy.party.fromKis}</p>
      {!snapshot || !legalName ? (
        <p className="mt-3 text-sm text-slate-600">{copy.party.empty}</p>
      ) : (
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-700">Nome</dt>
            <dd className="font-medium text-slate-900">{legalName}</dd>
          </div>
          {snapshot.document?.number ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-700">{copy.party.bi}</dt>
              <dd className="text-slate-800">
                {String(snapshot.document.kind).toUpperCase()} {snapshot.document.number}
              </dd>
            </div>
          ) : null}
          {snapshot.address?.line ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-700">
                {copy.party.address}
              </dt>
              <dd className="text-slate-800">{snapshot.address.line}</dd>
            </div>
          ) : null}
          {snapshot.phonePrimary ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-700">{copy.party.phone}</dt>
              <dd className="text-slate-800">{snapshot.phonePrimary}</dd>
            </div>
          ) : null}
          {snapshot.email ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-700">{copy.party.email}</dt>
              <dd className="text-slate-800">{snapshot.email}</dd>
            </div>
          ) : null}
          <div className="pt-1">
            <Badge variant={level >= 2 ? 'success' : 'warning'}>
              {KYC_LEVEL_LABELS[level]} · UTS {Number(snapshot.trustIndex ?? 0).toFixed(0)}
            </Badge>
          </div>
        </dl>
      )}
    </section>
  );
}
