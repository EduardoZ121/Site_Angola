'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getIdentidadeCopy } from '../content';
import { meetsActionKyc } from '../lib/kyc';

type KisGateBannerProps = {
  level: number;
  action?: string;
  minLevel?: number;
};

export function KisGateBanner({ level, action = 'contract', minLevel }: KisGateBannerProps) {
  const { locale } = useLocale();
  const copy = getIdentidadeCopy(locale);
  const allowed = minLevel != null ? level >= minLevel : meetsActionKyc(level, action);
  if (allowed) return null;

  return (
    <div
      role="status"
      className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-medium">{copy.kycGateTitle}</p>
      <p className="mt-1">{copy.kycGateBody}</p>
      <Link
        href="/app/centro-confianca"
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-2 inline-flex')}
      >
        {copy.kycCta}
      </Link>
    </div>
  );
}
