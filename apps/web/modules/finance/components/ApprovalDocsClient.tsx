'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Heading, Text } from '@kuteka/ui';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { MarkdownArticle } from '@/modules/institutional/components/InstitutionalDocument';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { useRoleExperience } from '@/modules/shell/components/RoleExperienceProvider';
import { createBrowserClient } from '@/lib/supabase/client';

type Props = {
  accountant: string;
  lawyer: string;
};

export function ApprovalDocsClient({ accountant, lawyer }: Props) {
  const { session, status, error } = useAppSession();
  const { mode } = useRoleExperience();
  const canReview =
    mode === 'founder' ||
    mode === 'accountant' ||
    Boolean(session?.permissions.includes('finance.read')) ||
    Boolean(session?.permissions.includes('founder.manage'));
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const docs = [
    {
      code: 'accounting-model',
      title: 'Pacote do contabilista',
      audience: 'accountant' as const,
      who: 'Contabilista',
      markdown: accountant,
      href: '/documentacao/contabilista',
    },
    {
      code: 'tax-compliance',
      title: 'Pacote do jurista',
      audience: 'lawyer' as const,
      who: 'Jurista',
      markdown: lawyer,
      href: '/documentacao/jurista',
    },
  ];

  async function review(code: string, audience: 'accountant' | 'lawyer', decision: 'approved' | 'changes_requested') {
    setBusy(code + decision);
    setResult(null);
    try {
      const client = createBrowserClient();
      const { error: rpcError } = await client.rpc('record_document_review', {
        p_doc_code: code,
        p_audience: audience,
        p_decision: decision,
        p_notes: notes[code] ?? '',
      });
      setResult(
        rpcError
          ? 'O texto está publicado. O registo do parecer ainda não ficou gravado. A base precisa da actualização 0052.'
          : 'Parecer gravado. Não altera impostos, contratos nem dinheiro.',
      );
    } catch {
      setResult('Não foi possível gravar o parecer.');
    }
    setBusy(null);
  }

  return (
    <SessionStatusGate status={status} error={error}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Aprovação externa</p>
          <Heading level={1}>Documentos para ler e aprovar</Heading>
          <Text className="mt-1 text-slate-700">
            Minutas para o contabilista e o jurista. Aprovar não liga pagamento real e não inventa a lei.
            {session?.email ? ` Conta: ${session.email}.` : ''}
          </Text>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/app/contabilista" className="underline">Cockpit do contabilista</Link>
            <Link href="/app/juridico" className="underline">Mesa jurídica</Link>
            <Link href="/app/financeiro" className="underline">Facturas</Link>
            <Link href="/app/fundador?tab=pessoas" className="underline">Nomear Contabilista</Link>
            <Link href="/termos" className="underline">Termos</Link>
            <Link href="/privacidade" className="underline">Privacidade</Link>
            <Link href="/cookies" className="underline">Cookies</Link>
          </div>
        </header>

        {result ? (
          <p className="rounded-kuteka border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">{result}</p>
        ) : null}

        {docs.map((doc) => (
          <article key={doc.code} className="kuteka-detail-panel flex flex-col gap-3 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Para o {doc.who}</p>
            <h2 className="text-base font-semibold text-slate-900">{doc.title}</h2>
            <MarkdownArticle markdown={doc.markdown} />
            <Link href={doc.href} className="text-sm font-semibold text-brand-700 underline">
              Abrir também em página pública
            </Link>
            <label className="text-sm font-medium text-slate-800" htmlFor={`notes-${doc.code}`}>
              Observação do parecer
            </label>
            <textarea
              id={`notes-${doc.code}`}
              value={notes[doc.code] ?? ''}
              onChange={(event) => setNotes((prev) => ({ ...prev, [doc.code]: event.target.value }))}
              className="min-h-20 rounded-kuteka border border-slate-300 px-3 py-2 text-sm"
            />
            {canReview ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" loading={busy === doc.code + 'approved'} onClick={() => void review(doc.code, doc.audience, 'approved')}>
                  Aprovado
                </Button>
                <Button type="button" size="sm" variant="secondary" loading={busy === doc.code + 'changes_requested'} onClick={() => void review(doc.code, doc.audience, 'changes_requested')}>
                  Pedir alterações
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Pode ler. Só o Founder ou o Contabilista grava o parecer.</p>
            )}
          </article>
        ))}
      </div>
    </SessionStatusGate>
  );
}
