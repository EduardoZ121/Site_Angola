'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useRoleExperience } from './RoleExperienceProvider';
import { EXPERIENCE_LABELS } from '../role-experience';
import { DOC_READ_KEY, parseDocRead, readingDocsFor, unreadReading } from '../lib/role-reading';

type RoleReadingPanelProps = {
  compact?: boolean;
};

export function RoleReadingPanel({ compact = false }: RoleReadingPanelProps) {
  const { mode } = useRoleExperience();
  const docs = readingDocsFor(mode);
  const [ack, setAck] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      setAck(parseDocRead(window.localStorage.getItem(DOC_READ_KEY)));
    } catch {
      setAck({});
    }
  }, []);

  function mark(id: string) {
    const next = { ...ack, [id]: new Date().toISOString() };
    setAck(next);
    try {
      window.localStorage.setItem(DOC_READ_KEY, JSON.stringify(next));
    } catch {
      /* the list still updates in this session */
    }
  }

  const pending = unreadReading(mode, ack);

  if (compact) {
    return (
      <p className="text-sm text-slate-600">
        {pending.length === 0
          ? `Leitura deste browser em dia para ${EXPERIENCE_LABELS[mode]}.`
          : `${pending.length} documento(s) por ler no papel ${EXPERIENCE_LABELS[mode]}.`}{' '}
        <Link href="/app/ajuda#leitura" className="font-semibold text-brand-700 underline">
          Abrir leitura
        </Link>
      </p>
    );
  }

  return (
    <section id="leitura" className="kuteka-detail-panel flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold text-slate-900">
        Leitura do papel {EXPERIENCE_LABELS[mode]}
      </h2>
      <p className="text-sm text-slate-600">
        {pending.length === 0
          ? 'Neste browser, os documentos deste papel estão marcados como lidos.'
          : `${pending.length} por ler. A marca fica só neste browser e não substitui a aprovação do contabilista ou do jurista.`}
      </p>
      <ul className="flex flex-col gap-3">
        {docs.map((doc) => {
          const read = Boolean(ack[doc.id]);
          return (
            <li key={doc.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={doc.href} className="text-sm font-semibold text-brand-700 underline">
                  {doc.title}
                </Link>
                {doc.note ? <p className="text-xs text-slate-500">{doc.note}</p> : null}
              </div>
              {read ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Lido</span>
              ) : (
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
                  onClick={() => mark(doc.id)}
                >
                  Marcar como lido
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
