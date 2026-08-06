'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  FINANCE_PRICING_MODELS,
  FINANCE_PRODUCT_CATEGORIES,
  type FinanceUpsertProductInput,
} from '@kuteka/validation';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import {
  listFinanceProducts,
  upsertProduct,
  type FinanceProductRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, selectClass, useFeedback, type PanelProps } from './shared';

const emptyForm: FinanceUpsertProductInput = {
  code: '',
  name: '',
  category: 'other',
  pricingModel: 'fixed',
  description: null,
  currency: 'AOA',
  buyerRoles: [],
  kaiSuggestible: false,
  active: true,
  amount: null,
  priceCode: null,
  chargeEvent: 'on_purchase',
};

export function CatalogPanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [products, setProducts] = useState<FinanceProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FinanceUpsertProductInput>(emptyForm);
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    const res = await listFinanceProducts();
    if (res.ok) setProducts(res.data);
    else setError(res.message);
    setLoading(false);
  }, [setError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('save');
    setError(null);
    setMessage(null);
    const res = await upsertProduct({
      ...form,
      amount: amount ? Number(amount) : null,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Produto ${form.code} guardado.`);
    setForm(emptyForm);
    setAmount('');
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection
          title={copy.upsertProduct}
          description="Config-first: cria ou actualiza um produto do catálogo transversal."
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="p-code">Código</Label>
              <Input
                id="p-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="ex: concierge.request"
                required
              />
            </div>
            <div>
              <Label htmlFor="p-name">Nome</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="p-cat">Categoria</Label>
              <select
                id="p-cat"
                className={selectClass}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as FinanceUpsertProductInput['category'],
                  }))
                }
              >
                {FINANCE_PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="p-model">Modelo de preço</Label>
              <select
                id="p-model"
                className={selectClass}
                value={form.pricingModel}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pricingModel: e.target.value as FinanceUpsertProductInput['pricingModel'],
                  }))
                }
              >
                {FINANCE_PRICING_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="p-amount">Preço inicial (AOA, opcional)</Label>
              <Input
                id="p-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={busy === 'save'}>
                {copy.upsertProduct}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && products.length === 0}>
        <PanelSection title={copy.sections.products}>
          <ul className="divide-y divide-slate-200">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium text-slate-900">{p.name}</p>
                  <p className="font-mono text-xs text-slate-500">{p.code}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default">{p.category}</Badge>
                  <Badge variant={p.active ? 'success' : 'warning'}>
                    {p.active ? 'Activo' : 'Off'}
                  </Badge>
                </div>
              </li>
            ))}
            {products.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem produtos.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
