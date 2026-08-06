'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Label } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import {
  formatAoaAmount,
  listCommissions,
  listFinanceProducts,
  listPriceRules,
  setCommission,
  updatePriceRule,
  type FinanceCommissionRow,
  type FinancePriceRuleRow,
  type FinanceProductRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, useFeedback, type PanelProps } from './shared';

export function PricingPanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [products, setProducts] = useState<FinanceProductRow[]>([]);
  const [rules, setRules] = useState<FinancePriceRuleRow[]>([]);
  const [commissions, setCommissions] = useState<FinanceCommissionRow[]>([]);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [comCode, setComCode] = useState('');
  const [comLabel, setComLabel] = useState('');
  const [comCategory, setComCategory] = useState('');
  const [comRate, setComRate] = useState('');

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? id.slice(0, 8);
  }, [products]);

  const load = useCallback(async () => {
    const [prods, priceRules, comms] = await Promise.all([
      listFinanceProducts(),
      listPriceRules(),
      listCommissions(),
    ]);
    if (prods.ok) setProducts(prods.data);
    if (priceRules.ok) {
      setRules(priceRules.data);
      const edits: Record<string, string> = {};
      for (const r of priceRules.data) edits[r.id] = r.amount != null ? String(r.amount) : '';
      setPriceEdits(edits);
    }
    if (comms.ok) setCommissions(comms.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSavePrice(ruleId: string) {
    if (!canManage) return;
    setBusy(`price-${ruleId}`);
    setError(null);
    const res = await updatePriceRule({ id: ruleId, amount: Number(priceEdits[ruleId]) });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage('Preço actualizado.');
    await load();
  }

  async function onSetCommission(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('commission');
    setError(null);
    setMessage(null);
    const res = await setCommission({
      code: comCode,
      label: comLabel,
      category: comCategory,
      takeRatePct: comRate ? Number(comRate) : null,
      fixedAmount: null,
      payerSide: 'provider',
      currency: 'AOA',
      active: true,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Comissão ${comCode} guardada.`);
    setComCode('');
    setComLabel('');
    setComCategory('');
    setComRate('');
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />
      <SoftListSlot pending={loading && rules.length === 0}>
        <PanelSection title={copy.sections.prices}>
          <ul className="flex flex-col gap-3">
            {rules.slice(0, 40).map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-kuteka border border-slate-200 p-3 sm:flex-row sm:items-end sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.label}</p>
                  <p className="text-xs text-slate-500">
                    {productName(r.product_id)} · {r.code} · {r.charge_event}
                    {r.urgency_band ? ` · ${r.urgency_band}` : ''}
                  </p>
                </div>
                {canManage ? (
                  <div className="flex items-end gap-2">
                    <div>
                      <Label htmlFor={`price-${r.id}`}>AOA</Label>
                      <Input
                        id={`price-${r.id}`}
                        className="w-28"
                        value={priceEdits[r.id] ?? ''}
                        onChange={(e) =>
                          setPriceEdits((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      loading={busy === `price-${r.id}`}
                      onClick={() => void onSavePrice(r.id)}
                    >
                      {copy.savePrice}
                    </Button>
                  </div>
                ) : (
                  <p className="font-semibold tabular-nums">
                    {formatAoaAmount(Number(r.amount ?? 0), r.currency)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </PanelSection>
      </SoftListSlot>

      {canManage ? (
        <PanelSection
          title={copy.setCommission}
          description="Take-rate configurável por categoria."
        >
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSetCommission}>
            <div>
              <Label htmlFor="c-code">Código</Label>
              <Input
                id="c-code"
                value={comCode}
                onChange={(e) => setComCode(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="c-label">Etiqueta</Label>
              <Input
                id="c-label"
                value={comLabel}
                onChange={(e) => setComLabel(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="c-cat">Categoria</Label>
              <Input
                id="c-cat"
                value={comCategory}
                onChange={(e) => setComCategory(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="c-rate">Take-rate %</Label>
              <Input
                id="c-rate"
                value={comRate}
                onChange={(e) => setComRate(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" loading={busy === 'commission'}>
                {copy.setCommission}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <PanelSection title={copy.sections.commissions}>
        <ul className="divide-y divide-slate-200">
          {commissions.map((c) => (
            <li key={c.id} className="flex justify-between gap-3 py-2 text-sm">
              <span>
                {c.label} <span className="text-slate-500">({c.payer_side})</span>
              </span>
              <span className="font-semibold tabular-nums">
                {c.take_rate_pct != null
                  ? `${c.take_rate_pct}%`
                  : formatAoaAmount(c.fixed_amount ?? 0)}
              </span>
            </li>
          ))}
          {commissions.length === 0 ? (
            <li className="py-3 text-sm text-slate-500">Sem comissões.</li>
          ) : null}
        </ul>
      </PanelSection>
    </div>
  );
}
