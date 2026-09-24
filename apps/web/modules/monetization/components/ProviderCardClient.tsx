'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { providerCategoryLabel } from '../lib/catalog';
import { getServiceProvider, type ServiceProviderRow } from '../services/monetization-client';
import { ProviderNetworkNav } from './ProviderNetworkNav';

const ACTIONS = ['Gostar', 'Favoritar', 'Comentários', 'Perguntar', 'Avaliar', 'Partilhar'] as const;

export function ProviderCardClient() {
  const params = useSearchParams();
  const id = params.get('id');
  const { status, error: sessionError } = useAppSession();
  const [row, setRow] = useState<ServiceProviderRow | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<(typeof ACTIONS)[number] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status !== 'ready' || !id) return;
    let cancelled = false;
    setLoading(true);
    void getServiceProvider(id).then((res) => {
      if (cancelled) return;
      if (res.ok) setRow(res.data);
      else setError(res.message);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, status]);

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!id) {
    return (
      <EmptyState
        title="Ficha sem prestador"
        description="Escolha um prestador na lista para abrir a ficha."
        action={
          <Link href="/app/servicos/encontrar" className={cn(buttonVariants({ variant: 'primary' }))}>
            Encontrar prestador
          </Link>
        }
      />
    );
  }

  return (
    <SessionStatusGate status={status} error={sessionError}>
      <div className="flex flex-col gap-5">
        <ProviderNetworkNav current="/app/servicos/ficha" />
        {error ? (
          <p className="rounded-kuteka border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
        <SoftListSlot pending={loading}>
          {!row ? (
            <EmptyState
              title="Ficha indisponível"
              description="Este prestador ainda não está activo, ou o endereço não existe."
              action={
                <Link href="/app/servicos/encontrar" className={cn(buttonVariants({ variant: 'secondary' }))}>
                  Voltar à lista
                </Link>
              }
            />
          ) : (
            <article className="kuteka-detail-panel p-5">
              <p className="kuteka-detail-eyebrow">{providerCategoryLabel(row.category)}</p>
              <Heading level={1}>{row.business_name}</Heading>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="success">{row.active ? 'Prestador activo' : 'Pendente'}</Badge>
                <Badge variant="default">
                  {row.rating ? `${Number(row.rating).toFixed(1)} ★` : 'Sem avaliações ainda'}
                </Badge>
                {row.municipality || row.province ? (
                  <Badge variant="default">{[row.municipality, row.province].filter(Boolean).join(', ')}</Badge>
                ) : null}
              </div>
              <Text className="mt-3 whitespace-pre-wrap text-slate-700">
                {row.description || 'O prestador ainda não escreveu a apresentação.'}
              </Text>
              <p className="mt-3 text-sm text-slate-600">
                Preço: solicitar orçamento. A comissão da Kuteka segue a regra da categoria, não um valor fixo nesta ficha.
              </p>
              {row.phone ? <p className="mt-1 text-sm text-slate-800">Telefone: {row.phone}</p> : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className={cn(buttonVariants({ variant: open === action ? 'primary' : 'secondary', size: 'sm' }))}
                    onClick={() => {
                      if (action === 'Partilhar') {
                        void share();
                        setOpen('Partilhar');
                        return;
                      }
                      setOpen(open === action ? null : action);
                    }}
                  >
                    {action}
                  </button>
                ))}
                <Link href="/app/servicos" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
                  Solicitar serviço
                </Link>
                {row.phone ? (
                  <a href={`tel:${row.phone}`} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                    Contactar
                  </a>
                ) : null}
              </div>

              {open ? (
                <div className="mt-4 rounded-kuteka border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {open === 'Avaliar'
                    ? 'A avaliação só abre depois de um serviço concluído, para evitar notas falsas. Faça-o na área de Serviços, no pedido concluído.'
                    : null}
                  {open === 'Perguntar' ? (
                    <Link href="/app/mensagens" className="underline">
                      Abrir mensagens
                    </Link>
                  ) : null}
                  {open === 'Partilhar' ? (copied ? 'Ligação copiada.' : 'Não foi possível copiar a ligação.') : null}
                  {open === 'Gostar' || open === 'Favoritar' || open === 'Comentários'
                    ? 'O painel está aqui, como nas fichas dos imóveis. Ainda não grava gosto, favorito ou comentário numa tabela nova: isso seria uma segunda rede social. A conversa real é nas Mensagens.'
                    : null}
                </div>
              ) : null}
            </article>
          )}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
