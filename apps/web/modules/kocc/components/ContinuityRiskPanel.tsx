'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listOperationalEscalations } from '@/modules/administracao/services/escalation-client';
import { visitRequestState } from '@/modules/habitacao/lib/visit-request';
import { listProvidersForReview } from '@/modules/monetization/services/monetization-client';
import { listQueue } from '@/modules/administracao/services/publication-review-client';
import { createBrowserClient } from '@/lib/supabase/client';
import { listDirectory, listOperationalTaskTerms } from '../services/institutional-client';

type Line = { label: string; detail: string; href: string };

/**
 * Mostra trabalho parado. Não inventa receita nem abre pagamento.
 */
export function ContinuityRiskPanel() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Line[] = [];
      const directory = await listDirectory();
      if (directory.ok) {
        const people = directory.data.filter((row) => !row.is_system_demo);
        const catalog = [
          { role: 'administrator', title: 'Aprovar prestadores e publicação' },
          { role: 'supervisor', title: 'Operação do dia' },
          { role: 'accountant', title: 'Preparar o fecho' },
        ];
        const missing = catalog.filter(
          (item) => !people.some((row) => row.roles.includes(item.role)),
        );
        if (missing.length) {
          next.push({
            label: 'Tarefas sem pessoa',
            detail: missing.map((item) => item.title).join(' · '),
            href: '/app/fundador',
          });
        }
      }

      const terms = await listOperationalTaskTerms();
      if (terms.ok) {
        const today = new Date().toISOString().slice(0, 10);
        const late = terms.data.filter((term) => term.endsOn && term.endsOn < today);
        if (late.length > 0) {
          next.push({
            label: 'Tarefas com o fim ultrapassado',
            detail: `${late.length} ainda activa(s). Não saem sozinhas: o Owner retira.`,
            href: '/app/fundador',
          });
        }
      }

      const escalations = await listOperationalEscalations(40);
      if (escalations.ok) {
        const open = escalations.data.filter((row) => row.status === 'open').length;
        if (open > 0) {
          next.push({
            label: 'Escalações sem resposta',
            detail: `${open} aberta(s). Quem tem o cargo pode aceitar ou recusar.`,
            href: '/app/admin#escalacoes',
          });
        }
      }

      try {
        const client = createBrowserClient();
        const { data, error } = await client
          .from('property_interests')
          .select('notes')
          .limit(40);
        if (!error) {
          const waiting = (data ?? []).filter(
            (row) => visitRequestState(row.notes as string | null) === 'requested',
          ).length;
          if (waiting > 0) {
            next.push({
              label: 'Visitas por aceitar',
              detail: `${waiting} pedido(s) visíveis nesta conta.`,
              href: '/app/agente',
            });
          }
        }
      } catch {
        /* sem leitura de interesses */
      }

      const providers = await listProvidersForReview();
      if (providers.ok) {
        const waiting = providers.data.filter((row) => !row.active && !row.is_demo).length;
        if (waiting > 0) {
          next.push({
            label: 'Prestadores à espera',
            detail: `${waiting} por aprovar. Sem aprovação não entram no mercado.`,
            href: '/app/servicos/area',
          });
        }
      }

      const publications = await listQueue(40);
      if (publications.ok) {
        const open = publications.data.filter(
          (row) => row.review_status !== 'approved' && row.review_status !== 'rejected',
        );
        const overdue = open.filter((row) => {
          if (!row.sla_deadline_at) return false;
          const at = Date.parse(row.sla_deadline_at);
          return !Number.isNaN(at) && at < Date.now();
        }).length;
        if (open.length > 0) {
          next.push({
            label: 'Publicações por decidir',
            detail:
              overdue > 0
                ? `${open.length} na fila, ${overdue} já fora do prazo.`
                : `${open.length} na fila. Sem decisão o imóvel não entra no mercado.`,
            href: '/app/admin#publication-queue-heading',
          });
        }
      }

      if (!cancelled) {
        setLines(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold text-slate-900">O que evita a Kuteka parar</h2>
      <p className="text-sm text-slate-700">
        O risco não se reduz a inventar receita. Reduz-se a não deixar o trabalho numa só pessoa e a não deixar casos sem resposta. Pagamento real, comissão nova e factura continuam fechados.
      </p>
      {loading ? <p className="text-sm text-slate-600">A ler o que está parado…</p> : null}
      {!loading && lines.length === 0 ? (
        <p className="text-sm text-slate-600">
          Nesta conta não há tarefa vazia, escalação aberta, visita por aceitar, prestador à espera nem publicação por decidir. Isso não significa que haja receita.
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {lines.map((line) => (
          <li key={line.label} className="rounded-kuteka border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-sm font-medium text-slate-900">{line.label}</p>
            <p className="text-sm text-slate-700">{line.detail}</p>
            <Link href={line.href} className="text-sm font-semibold text-brand-800 underline">
              Abrir
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
