'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import {
  formatAoaAmount,
  generateInvoicePdf,
  listInvoices,
  markInvoiceEmailed,
  type FinanceInvoiceRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, useFeedback, type PanelProps } from './shared';

function openHtml(html: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function InvoicesPanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [invoices, setInvoices] = useState<FinanceInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await listInvoices(30);
    if (res.ok) setInvoices(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onGenerate(id: string) {
    setBusy(`pdf-${id}`);
    setError(null);
    setMessage(null);
    const res = await generateInvoicePdf({ invoiceId: id });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    openHtml(res.data.html);
    setMessage(`Fatura ${res.data.number} gerada.`);
    await load();
  }

  async function onMarkEmailed(inv: FinanceInvoiceRow) {
    if (!canManage) return;
    const email = window.prompt('Email de destino da fatura', inv.email_to ?? '');
    if (!email) return;
    setBusy(`mail-${inv.id}`);
    setError(null);
    const res = await markInvoiceEmailed({ invoiceId: inv.id, email });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Fatura marcada como enviada para ${email}.`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />
      <SoftListSlot pending={loading && invoices.length === 0}>
        <PanelSection title={copy.sections.invoices}>
          <ul className="divide-y divide-slate-200">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-mono text-sm font-medium text-slate-900">{inv.number}</p>
                  <p className="text-xs text-slate-500">
                    {formatAoaAmount(Number(inv.total), inv.currency)}
                    {inv.email_sent_at ? ` · enviada` : ''}
                    {inv.pdf_generated_at ? ` · PDF pronto` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inv.status === 'paid' ? 'success' : 'default'}>
                    {inv.status}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    loading={busy === `pdf-${inv.id}`}
                    onClick={() => void onGenerate(inv.id)}
                  >
                    {copy.generatePdf}
                  </Button>
                  {canManage ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      loading={busy === `mail-${inv.id}`}
                      onClick={() => void onMarkEmailed(inv)}
                    >
                      {copy.markEmailed}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
            {invoices.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem faturas.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
