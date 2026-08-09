'use client';

import { useEffect } from 'react';
import { helpFocusForRole, type HelpRoleSlug } from '@/modules/institutional/lib/help-role';

/** Lightweight client redirect for `/app/ajuda/<papel>` entry points. */
export function RoleHelpRedirect({ papel }: { papel: HelpRoleSlug }) {
  useEffect(() => {
    const focus = helpFocusForRole(papel);
    window.location.replace(`/app/ajuda?sec=${focus.section}&papel=${papel}#${focus.headingHint}`);
  }, [papel]);

  return (
    <main className="mx-auto max-w-xl p-6 text-sm text-slate-700">
      A abrir o guia do papel <strong>{papel}</strong>…
    </main>
  );
}
