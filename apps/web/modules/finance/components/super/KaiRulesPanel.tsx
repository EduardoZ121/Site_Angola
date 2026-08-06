'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import { listKaiRules, upsertKaiRule, type FinanceKaiRuleRow } from '../../services/finance-client';
import { Feedback, PanelSection, useFeedback, type PanelProps } from './shared';

export function KaiRulesPanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [rules, setRules] = useState<FinanceKaiRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [trigger, setTrigger] = useState('');
  const [target, setTarget] = useState('');

  const load = useCallback(async () => {
    const res = await listKaiRules();
    if (res.ok) setRules(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('kai');
    setError(null);
    setMessage(null);
    const res = await upsertKaiRule({
      code,
      label,
      triggerEvent: trigger,
      targetProductCode: target || null,
      priority: 100,
      active: true,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Regra ${code} guardada.`);
    setCode('');
    setLabel('');
    setTrigger('');
    setTarget('');
    await load();
  }

  async function onToggle(rule: FinanceKaiRuleRow) {
    if (!canManage) return;
    setBusy(`toggle-${rule.id}`);
    setError(null);
    const res = await upsertKaiRule({
      code: rule.code,
      label: rule.label,
      triggerEvent: rule.trigger_event,
      targetProductCode: rule.target_product_code,
      description: rule.description,
      targetSegment: rule.target_segment,
      consentScope: rule.consent_scope,
      priority: rule.priority,
      active: !rule.active,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Regra ${rule.code} ${rule.active ? 'desactivada' : 'activada'}.`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection
          title={copy.upsertKai}
          description="Motor de sugestões comerciais KAI (opt-in por consentimento)."
        >
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="k-code">Código</Label>
              <Input id="k-code" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="k-label">Etiqueta</Label>
              <Input
                id="k-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="k-trigger">Evento</Label>
              <Input
                id="k-trigger"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="k-target">Produto alvo (opcional)</Label>
              <Input id="k-target" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" loading={busy === 'kai'}>
                {copy.upsertKai}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && rules.length === 0}>
        <PanelSection title={copy.sections.kai}>
          <ul className="divide-y divide-slate-200">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">{r.label}</p>
                  <p className="text-sm text-slate-600">{r.description}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {r.code} · {r.trigger_event}
                    {r.target_product_code ? ` → ${r.target_product_code}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.active ? 'success' : 'warning'}>
                    {r.active ? 'Activa' : 'Off'}
                  </Badge>
                  {canManage ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={busy === `toggle-${r.id}`}
                      onClick={() => void onToggle(r)}
                    >
                      {r.active ? 'Desactivar' : 'Activar'}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
            {rules.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem regras KAI.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
