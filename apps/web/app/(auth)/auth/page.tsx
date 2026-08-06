'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '@/modules/authentication/content';

function AuthIndexRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);

  useEffect(() => {
    const next = searchParams.get('next');
    const mode = searchParams.get('mode');
    const q = new URLSearchParams();
    if (next) q.set('next', next);
    const qs = q.toString() ? `?${q.toString()}` : '';
    router.replace(mode === 'entrar' ? `/auth/entrar${qs}` : `/auth/registar${qs}`);
  }, [router, searchParams]);

  return <p className="text-slate-500">{copy.common.loading}</p>;
}

export default function AuthIndexPage() {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-slate-500">…</p>}>
      <AuthIndexRedirect />
    </Suspense>
  );
}
