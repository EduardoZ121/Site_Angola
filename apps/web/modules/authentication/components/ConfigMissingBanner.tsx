'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '../content';
import { isPublicSupabaseConfigured } from '../lib/public-config';

/** Only shows after mount — avoids false “config em falta” flash when kuteka-config.js is present. */
export function ConfigMissingBanner() {
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!isPublicSupabaseConfigured());
  }, []);

  if (!show) return null;

  return (
    <p
      role="status"
      className="mt-4 rounded-kuteka border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm text-amber-50"
    >
      {copy.common.configMissing}
    </p>
  );
}
