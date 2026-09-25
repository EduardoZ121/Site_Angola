'use client';

import { useEffect, useState } from 'react';
import { useAppSession } from '@/modules/authentication/components/app-session';
import {
  readOpeningSettings,
  setOpeningSetting,
  type OpeningRow,
} from '../lib/opening-settings';

export function OpeningSettingsPanel() {
  const { session } = useAppSession();
  const canRegulate = Boolean(
    session?.permissions.includes('finance.manage') ||
      session?.permissions.includes('founder.manage') ||
      session?.permissions.includes('admin.panel') ||
      session?.roles.includes('accountant'),
  );
  const [rows, setRows] = useState<OpeningRow[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void readOpeningSettings().then(setRows);
  }, []);

  async function onToggle(row: OpeningRow) {
    if (!canRegulate) return;
    setBusy(row.code);
    setNote(null);
    const result = await setOpeningSetting(row, !row.enabled);
    setBusy(null);
    if (!result.ok) {
      setNote(result.message);
      return;
    }
    setRows((current) =>
      current.map((item) =>
        item.code === row.code ? { ...item, enabled: !row.enabled, stored: true } : item,
      ),
    );
    setNote(row.enabled ? `${row.label} fechado.` : `${row.label} aberto.`);
  }

  return (
    <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold text-slate-900">Abertura da plataforma</h2>
      <p className="text-sm text-slate-700">
        Estas opções já existem. Abrir ou fechar não pede programação nova. A cobrança nasce fechada e só abre aqui.
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.code} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{row.label}</p>
              <p className="text-sm text-slate-600">{row.description}</p>
              {!row.stored ? (
                <p className="text-xs text-slate-500">Ainda não gravado. O estado mostrado é o de origem.</p>
              ) : null}
            </div>
            {canRegulate ? (
              <button
                type="button"
                className="kuteka-detail-chip kuteka-detail-chip--accent"
                disabled={busy === row.code}
                onClick={() => void onToggle(row)}
              >
                {busy === row.code ? 'A gravar…' : row.enabled ? 'Aberto · fechar' : 'Fechado · abrir'}
              </button>
            ) : (
              <span className="text-sm text-slate-600">{row.enabled ? 'Aberto' : 'Fechado'}</span>
            )}
          </li>
        ))}
      </ul>
      {note ? <p className="text-sm text-slate-700">{note}</p> : null}
    </section>
  );
}
