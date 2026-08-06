'use client';

import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '../content';

export function AuthLoadingFallback() {
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);
  return <p className="text-slate-500">{copy.common.loading}</p>;
}
