'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { useRoleExperience } from '@/modules/shell/components/RoleExperienceProvider';
import { listServiceOrders } from '@/modules/monetization/services/monetization-client';
import { OpeningSettingsPanel } from '@/modules/kocc/components/OpeningSettingsPanel';
import {
  formatAoaAmount,
  listCampaigns,
  listFinanceProducts,
  listInvoices,
  listRefunds,
  type FinanceCampaignRow,
  type FinanceInvoiceRow,
  type FinanceProductRow,
  type FinanceRefundRow,
} from '../services/finance-client';

type TabKey =
  | 'painel'
  | 'fecho'
  | 'receitas'
  | 'despesas'
  | 'facturacao'
  | 'pagamentos'
  | 'reconciliacao'
  | 'fiscais'
  | 'calendario'
  | 'documentos'
  | 'relatorios'
  | 'pendencias'
  | 'auditoria';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'painel', label: 'Painel' },
  { key: 'fecho', label: 'Fecho mensal' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'despesas', label: 'Despesas' },
  { key: 'facturacao', label: 'Facturação' },
  { key: 'pagamentos', label: 'Pagamentos' },
  { key: 'reconciliacao', label: 'Reconciliação' },
  { key: 'fiscais', label: 'Obrigações fiscais' },
  { key: 'calendario', label: 'Calendário fiscal' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'pendencias', label: 'Pendências' },
  { key: 'auditoria', label: 'Auditoria' },
];

const CLOSE_ITEMS = [
  'Facturas do mês revistas',
  'Reembolsos revistos',
  'Comissões de serviços revistas',
  'Campanhas activas revistas',
  'Divergências anotadas',
  'Validação do contabilista',
];

type WorkFile = {
  id: string;
  name: string;
  note: string;
  size: number;
  addedAt: string;
};

const FILE_KEY = 'kuteka-accountant-files';

function readWorkFiles(): WorkFile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FILE_KEY);
    const parsed = raw ? (JSON.parse(raw) as WorkFile[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Cockpit de leitura sobre Kuteka Pay, facturas, reembolsos e campanhas.
 * Não cria livro paralelo, não calcula imposto e não paga a AGT.
 */
export function AccountantCockpitClient() {
  const { session, status, error: sessionError } = useAppSession();
  const { mode } = useRoleExperience();
  const allowed =
    mode === 'founder' ||
    mode === 'accountant' ||
    mode === 'super_administrator' ||
    mode === 'administrator' ||
    Boolean(session?.permissions.includes('finance.read')) ||
    Boolean(session?.permissions.includes('finance.manage'));
  const [tab, setTab] = useState<TabKey>('painel');
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<FinanceInvoiceRow[]>([]);
  const [refunds, setRefunds] = useState<FinanceRefundRow[]>([]);
  const [products, setProducts] = useState<FinanceProductRow[]>([]);
  const [campaigns, setCampaigns] = useState<FinanceCampaignRow[]>([]);
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<WorkFile[]>([]);
  const [fileNote, setFileNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [inv, ref, prod, camp, orders] = await Promise.all([
      listInvoices(30),
      listRefunds(20),
      listFinanceProducts(),
      listCampaigns(),
      listServiceOrders(),
    ]);
    if (inv.ok) setInvoices(inv.data);
    if (ref.ok) setRefunds(ref.data);
    if (prod.ok) setProducts(prod.data);
    if (camp.ok) setCampaigns(camp.data);
    if (orders.ok) {
      setOrderCount(orders.data.length);
      setCommissionTotal(
        orders.data.reduce((sum, row) => sum + (Number(row.commission_aoa) || 0), 0),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setFiles(readWorkFiles());
  }, []);

  useEffect(() => {
    if (status === 'ready' && allowed) void load();
    else if (status === 'ready') setLoading(false);
  }, [allowed, load, status]);

  const invoiceTotal = useMemo(
    () => invoices.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [invoices],
  );
  const refundTotal = useMemo(
    () => refunds.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [refunds],
  );
  const closePct = Math.round(
    (CLOSE_ITEMS.filter((item) => checked[item]).length / CLOSE_ITEMS.length) * 100,
  );

  function attachFile(file: File | null) {
    if (!file) return;
    const next: WorkFile = {
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      note: fileNote.trim(),
      size: file.size,
      addedAt: new Date().toISOString(),
    };
    const saved = [next, ...files].slice(0, 30);
    setFiles(saved);
    setFileNote('');
    try {
      window.localStorage.setItem(FILE_KEY, JSON.stringify(saved));
    } catch {
      /* the list still shows in this session */
    }
  }

  function removeFile(id: string) {
    const saved = files.filter((item) => item.id !== id);
    setFiles(saved);
    try {
      window.localStorage.setItem(FILE_KEY, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }

  function downloadPackage() {
    const lines = [
      'pacote,kuteka,trabalho,nao_e_declaracao_fiscal',
      'tipo,referencia,estado,valor',
      ...invoices.map((row) => `factura,${row.number},${row.status},${row.total}`),
      ...refunds.map((row) => `reembolso,${row.id},${row.status},${row.amount}`),
      `comissoes_servicos_visiveis,,${orderCount},${commissionTotal}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kuteka-pacote-trabalho.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SessionStatusGate status={status} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Cockpit do contabilista · leitura</p>
          <Heading level={1}>Contabilidade da Kuteka</Heading>
          <Text className="mt-1 text-slate-700">
            Organiza o que já está no financeiro. Não substitui o contabilista, não substitui a AGT
            e não mexe no dinheiro dos clientes. O fecho desta página não fecha o mês na base.
          </Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/app/aprovacoes" className="underline">
              Documentos para o contabilista e o jurista
            </Link>
            <Link href="/app/financeiro" className="underline">
              Facturas
            </Link>
            <Link href="/app/fundador?tab=pessoas" className="underline">
              Promover alguém a Contabilista
            </Link>
          </div>
        </header>
        {allowed ? <OpeningSettingsPanel /> : null}

        {!allowed ? (
          <p className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Esta área é do Founder, do Super e de quem tem leitura financeira. Um cliente não vê a contabilidade da empresa.
          </p>
        ) : (
          <>
            <nav className="flex flex-wrap gap-2" aria-label="Menu do contabilista">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={
                    tab === item.key
                      ? 'rounded-full bg-slate-900 px-3 py-1 text-sm text-white'
                      : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800'
                  }
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <SoftListSlot pending={loading}>
              {tab === 'painel' ? (
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Facturas visíveis" value={formatAoaAmount(invoiceTotal)} hint={`${invoices.length} documentos`} onOpen={() => setTab('facturacao')} />
                  <Metric label="Reembolsos visíveis" value={formatAoaAmount(refundTotal)} hint={`${refunds.length} movimentos`} onOpen={() => setTab('pagamentos')} />
                  <Metric label="Comissão de serviços" value={formatAoaAmount(commissionTotal)} hint={`${orderCount} pedidos visíveis`} onOpen={() => setTab('receitas')} />
                  <Metric label="Preparação do fecho" value={`${closePct}%`} hint="Não fecha o período" onOpen={() => setTab('fecho')} />
                </section>
              ) : null}

              {tab === 'fecho' ? (
                <section className="kuteka-detail-panel p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Preparação do fecho</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Lista de trabalho nesta sessão. Marcar uma caixa não altera facturas, ledger nem impostos.
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {CLOSE_ITEMS.map((item) => (
                      <li key={item}>
                        <label className="flex items-center gap-2 text-sm text-slate-800">
                          <input
                            type="checkbox"
                            checked={Boolean(checked[item])}
                            onChange={(event) =>
                              setChecked((prev) => ({ ...prev, [item]: event.target.checked }))
                            }
                          />
                          {item}
                        </label>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-medium text-slate-900">Progresso de preparação: {closePct}%</p>
                </section>
              ) : null}

              {tab === 'receitas' ? (
                <section className="kuteka-detail-panel p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">Receitas já registadas</h2>
                  <p className="mt-1">Facturas visíveis: {formatAoaAmount(invoiceTotal)}</p>
                  <p>Comissões de serviços visíveis: {formatAoaAmount(commissionTotal)}</p>
                  <p>Campanhas activas: {campaigns.filter((row) => row.active).length}</p>
                  <p className="mt-2">
                    Publicidade, destaque, assinatura e B2B ainda não geram receita real. Não somo valores inventados.
                  </p>
                </section>
              ) : null}

              {tab === 'despesas' ? (
                <section className="kuteka-detail-panel p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">Despesas</h2>
                  <p className="mt-1">
                    Ainda não há livro de despesas próprio. Fornecedores, rendas e serviços da empresa ficam pendentes
                    até o contabilista definir as categorias. Não criei uma segunda tabela.
                  </p>
                  <Badge variant="warning">Pendente de validação</Badge>
                </section>
              ) : null}

              {tab === 'facturacao' ? (
                <section className="kuteka-detail-panel p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Facturas existentes</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    São as facturas do Kuteka Pay. Não são facturas certificadas da AGT.
                  </p>
                  <ul className="mt-3 divide-y divide-slate-200">
                    {invoices.map((row) => (
                      <li key={row.id} className="flex justify-between gap-2 py-2 text-sm">
                        <span>{row.number}</span>
                        <span>{row.status}</span>
                        <span>{formatAoaAmount(Number(row.total))}</span>
                      </li>
                    ))}
                    {invoices.length === 0 ? <li className="py-2 text-sm text-slate-600">Sem facturas visíveis.</li> : null}
                  </ul>
                </section>
              ) : null}

              {tab === 'pagamentos' ? (
                <section className="kuteka-detail-panel p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">Pagamentos fiscais</h2>
                  <p className="mt-1">
                    O fluxo previsto é: obrigação → contabilista valida → Founder autoriza → canal oficial → reconciliação.
                    Não há botão para pagar a AGT. O canal oficial ainda não está ligado.
                  </p>
                  <Badge variant="warning">Bloqueado</Badge>
                </section>
              ) : null}

              {tab === 'reconciliacao' ? (
                <section className="kuteka-detail-panel p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">Reconciliação</h2>
                  <p className="mt-1">
                    Reembolsos visíveis: {refunds.length} · {formatAoaAmount(refundTotal)}. A reconciliação bancária
                    continua no Super. Esta página só lê.
                  </p>
                  <Link href="/app/super" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3')}>
                    Abrir Super
                  </Link>
                </section>
              ) : null}

              {tab === 'fiscais' || tab === 'calendario' ? (
                <section className="kuteka-detail-panel p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">
                    {tab === 'fiscais' ? 'Obrigações fiscais' : 'Calendário fiscal'}
                  </h2>
                  <p className="mt-1">
                    IVA, imposto industrial, segurança social e facturação certificada aparecem só como pendência.
                    Esta página não diz a data nem o valor legal. Isso é do contabilista e da AGT.
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {['IVA', 'Imposto industrial', 'Segurança social', 'Facturação certificada'].map((item) => (
                      <li key={item} className="flex items-center justify-between gap-2">
                        <span>{item}</span>
                        <Badge variant="warning">A validar</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {tab === 'documentos' ? (
                <section className="kuteka-detail-panel flex flex-col gap-3 p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">Documentos de trabalho</h2>
                  <p>
                    Anexe o nome do comprovativo e uma nota. O ficheiro não vai para um banco nem para a AGT.
                    Fica nesta conta, neste navegador, até o remover.
                  </p>
                  <ul className="list-disc pl-5">
                    <li>Comprovativo bancário do período — por receber, se o contabilista o tiver</li>
                    <li>Validação fiscal — continua no <Link href="/app/aprovacoes" className="underline">parecer</Link></li>
                    <li>Factura certificada AGT — desligada</li>
                  </ul>
                  <label className="text-sm font-medium text-slate-800">
                    Nota
                    <input
                      className="mt-1 w-full rounded-kuteka border border-slate-300 px-3 py-2"
                      value={fileNote}
                      onChange={(event) => setFileNote(event.target.value)}
                      placeholder="Ex.: extracto de Agosto, ainda não conciliado"
                    />
                  </label>
                  <label className="w-fit cursor-pointer rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                    Anexar documento
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(event) => {
                        attachFile(event.target.files?.[0] ?? null);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <ul className="divide-y divide-slate-200">
                    {files.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-3 py-2">
                        <span>
                          <span className="font-medium text-slate-900">{item.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-600">
                            {item.note || 'Sem nota'} · {new Date(item.addedAt).toLocaleString('pt-AO')}
                          </span>
                        </span>
                        <button type="button" className="text-xs font-semibold text-red-700" onClick={() => removeFile(item.id)}>
                          Remover
                        </button>
                      </li>
                    ))}
                    {files.length === 0 ? <li className="py-2 text-slate-600">Ainda não há anexos neste navegador.</li> : null}
                  </ul>
                </section>
              ) : null}

              {tab === 'relatorios' ? (
                <section className="kuteka-detail-panel flex flex-col gap-3 p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">Pacote de trabalho</h2>
                  <p>
                    Descarrega um CSV com as facturas, reembolsos e comissões visíveis. Não é declaração fiscal nem Excel oficial.
                  </p>
                  <Button type="button" variant="secondary" onClick={downloadPackage}>
                    Gerar pacote de trabalho
                  </Button>
                  <p>
                    Produtos financeiros activos: {products.filter((row) => row.active).length}. Campanhas:{' '}
                    {campaigns.length}.
                  </p>
                </section>
              ) : null}

              {tab === 'pendencias' ? (
                <section className="kuteka-detail-panel p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">O que precisa de atenção</h2>
                  <ul className="mt-2 list-disc pl-5">
                    <li>
                      O Founder nomeia o contabilista em{' '}
                      <Link href="/app/fundador?tab=pessoas" className="underline">Pessoas</Link>.
                      O papel só lê, prepara o fecho e anexa documentos.
                    </li>
                    <li>Despesas da empresa ainda não têm livro. O contabilista define as categorias.</li>
                    <li>Pagamento à AGT bloqueado. Não há botão de dinheiro real.</li>
                    <li>O fecho mensal não tranca o período.</li>
                    <li>
                      Os textos para aprovar estão em{' '}
                      <Link href="/app/aprovacoes" className="underline">Aprovações</Link>.
                    </li>
                  </ul>
                </section>
              ) : null}

              {tab === 'auditoria' ? (
                <section className="kuteka-detail-panel p-5 text-sm text-slate-700">
                  <h2 className="font-semibold text-slate-900">Auditoria</h2>
                  <p className="mt-1">
                    Este cockpit não apaga histórico e não muda parâmetros comerciais. A auditoria institucional continua no Founder Center.
                  </p>
                  <Link href="/app/fundador?tab=auditoria" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3')}>
                    Abrir auditoria do Founder
                  </Link>
                </section>
              ) : null}
            </SoftListSlot>
          </>
        )}
      </div>
    </SessionStatusGate>
  );
}

function Metric({
  label,
  value,
  hint,
  onOpen,
}: {
  label: string;
  value: string;
  hint: string;
  onOpen?: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="kuteka-detail-panel p-4 text-left transition hover:border-slate-900">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600">{hint}</p>
    </button>
  );
}
