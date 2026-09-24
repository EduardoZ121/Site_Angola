'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@kuteka/ui';
import {
  EMPTY_COMPANY_PROFILE,
  validateCompanyProfile,
  validateVaultCode,
  type CompanyProfileInput,
} from '../lib/company-vault';
import {
  fetchCompanyVaultStatus,
  readCompanyProfile,
  setCompanyVaultCode,
  updateCompanyProfile,
  type CompanyVaultStatus,
} from '../services/company-vault-client';

const FIELDS: { key: keyof CompanyProfileInput; label: string; autoComplete?: string }[] = [
  { key: 'bankName', label: 'Banco' },
  { key: 'iban', label: 'IBAN da empresa', autoComplete: 'off' },
  { key: 'accountNumber', label: 'Número da conta' },
  { key: 'accountHolder', label: 'Titular' },
  { key: 'currency', label: 'Moeda' },
  { key: 'phone', label: 'Telefone oficial', autoComplete: 'tel' },
  { key: 'whatsapp', label: 'WhatsApp oficial', autoComplete: 'tel' },
  { key: 'email', label: 'Email oficial', autoComplete: 'email' },
  { key: 'address', label: 'Endereço' },
];

/**
 * Founder Owner vault for Kuteka's own bank and official contacts.
 * The second code lives only in component memory and is checked by the database.
 */
export function CompanyVaultPanel() {
  const [status, setStatus] = useState<CompanyVaultStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [nextCode, setNextCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [profile, setProfile] = useState<CompanyProfileInput>(EMPTY_COMPANY_PROFILE);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [changingCode, setChangingCode] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await fetchCompanyVaultStatus();
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setStatus(null);
      return;
    }
    setStatus(result.data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function lock() {
    setUnlocked(false);
    setCode('');
    setProfile(EMPTY_COMPANY_PROFILE);
    setUpdatedAt(null);
    setChangingCode(false);
    setNotice(null);
  }

  async function onDefineCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const lengthError = validateVaultCode(nextCode);
    if (lengthError) {
      setError(lengthError);
      return;
    }
    if (nextCode.trim() !== confirmCode.trim()) {
      setError('A confirmação do código não coincide.');
      return;
    }
    setBusy(true);
    const saved = await setCompanyVaultCode({
      newCode: nextCode,
      currentCode: status?.codeConfigured ? code : null,
    });
    setBusy(false);
    if (!saved.ok) {
      setError(saved.message);
      return;
    }
    const opened = nextCode.trim();
    setCode(opened);
    setNextCode('');
    setConfirmCode('');
    setChangingCode(false);
    await reload();
    await openWith(opened);
  }

  async function openWith(value: string) {
    setError(null);
    setNotice(null);
    const lengthError = validateVaultCode(value);
    if (lengthError) {
      setError(lengthError);
      return;
    }
    setBusy(true);
    const result = await readCompanyProfile(value);
    setBusy(false);
    if (!result.ok) {
      setUnlocked(false);
      setError(result.message);
      return;
    }
    const { updatedAt: stamp, ...rest } = result.data;
    setProfile(rest);
    setUpdatedAt(stamp);
    setCode(value.trim());
    setUnlocked(true);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const invalid = validateCompanyProfile(profile);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    const result = await updateCompanyProfile(code, profile);
    setBusy(false);
    if (!result.ok) {
      if (result.message.includes('incorrecto') || result.message.includes('bloqueado')) lock();
      setError(result.message);
      return;
    }
    const { updatedAt: stamp, ...rest } = result.data;
    setProfile(rest);
    setUpdatedAt(stamp);
    setNotice('Dados institucionais guardados. A alteração ficou registada na auditoria.');
  }

  const lockedUntil = status?.lockedUntil ? new Date(status.lockedUntil) : null;
  const isLocked = Boolean(lockedUntil && lockedUntil.getTime() > Date.now());

  return (
    <section
      className="kuteka-detail-panel flex flex-col gap-4 p-5"
      aria-labelledby="company-vault"
    >
      <div>
        <p className="kuteka-detail-eyebrow">Cofre institucional</p>
        <h2 id="company-vault" className="kuteka-detail-title mt-1">
          Perfil da Kuteka
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Banco, IBAN, telefone, WhatsApp, email e endereço oficiais da empresa. Separado dos dados
          bancários pessoais do Founder. Só o Owner entra, e só com um segundo código verificado no
          servidor. Esse código não fica guardado neste browser.
        </p>
      </div>

      {loading ? <p className="text-sm text-slate-600">A verificar o cofre…</p> : null}

      {!loading && status && !status.isOwner ? (
        <p className="text-sm text-slate-700">Esta área é exclusiva do Founder Owner.</p>
      ) : null}

      {!loading && error ? (
        <div
          role="alert"
          className="rounded-kuteka border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
        >
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
        >
          {notice}
        </div>
      ) : null}

      {!loading && status?.isOwner && !status.codeConfigured && !unlocked ? (
        <form
          className="flex max-w-md flex-col gap-3"
          onSubmit={(event) => void onDefineCode(event)}
        >
          <p className="text-sm text-slate-700">
            Ainda não existe código do cofre. Defina-o agora. Não use a senha da conta.
          </p>
          <VaultCodeField label="Novo código do cofre" value={nextCode} onChange={setNextCode} />
          <VaultCodeField label="Confirmar código" value={confirmCode} onChange={setConfirmCode} />
          <Button type="submit" disabled={busy} className="w-fit">
            {busy ? 'A definir…' : 'Definir código do cofre'}
          </Button>
        </form>
      ) : null}

      {!loading && status?.isOwner && status.codeConfigured && !unlocked ? (
        <form
          className="flex max-w-md flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void openWith(code);
          }}
        >
          <VaultCodeField
            label="Código do cofre"
            value={code}
            onChange={setCode}
            disabled={isLocked}
          />
          {isLocked && lockedUntil ? (
            <p className="text-sm text-amber-900">
              Bloqueado até{' '}
              {lockedUntil.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}.
            </p>
          ) : null}
          <Button type="submit" disabled={busy || isLocked} className="w-fit">
            {busy ? 'A verificar…' : 'Entrar no perfil da empresa'}
          </Button>
        </form>
      ) : null}

      {unlocked ? (
        <form className="flex flex-col gap-4" onSubmit={(event) => void onSave(event)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-800">{field.label}</span>
                <input
                  value={profile[field.key]}
                  autoComplete={field.autoComplete ?? 'off'}
                  maxLength={field.key === 'address' ? 240 : 120}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, [field.key]: event.target.value }))
                  }
                  className="kuteka-ops-input"
                />
              </label>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-800">Outros contactos oficiais</span>
            <textarea
              value={profile.otherContacts}
              maxLength={500}
              rows={3}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, otherContacts: event.target.value }))
              }
              className="kuteka-ops-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-800">Notas de pagamento</span>
            <textarea
              value={profile.paymentNotes}
              maxLength={500}
              rows={3}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, paymentNotes: event.target.value }))
              }
              className="kuteka-ops-input"
            />
          </label>
          {updatedAt ? (
            <p className="text-xs text-slate-600">
              Última alteração: {new Date(updatedAt).toLocaleString('pt-PT')}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy} className="w-fit">
              {busy ? 'A guardar…' : 'Guardar perfil da empresa'}
            </Button>
            <Button type="button" variant="secondary" className="w-fit" onClick={lock}>
              Bloquear
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-fit"
              onClick={() => setChangingCode((value) => !value)}
            >
              Alterar código
            </Button>
          </div>
        </form>
      ) : null}

      {unlocked && changingCode ? (
        <form
          className="flex max-w-md flex-col gap-3 border-t border-slate-200 pt-4"
          onSubmit={(event) => void onDefineCode(event)}
        >
          <VaultCodeField label="Novo código do cofre" value={nextCode} onChange={setNextCode} />
          <VaultCodeField
            label="Confirmar novo código"
            value={confirmCode}
            onChange={setConfirmCode}
          />
          <Button type="submit" disabled={busy} className="w-fit">
            {busy ? 'A actualizar…' : 'Actualizar código'}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function VaultCodeField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <input
        type="password"
        value={value}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        maxLength={64}
        onChange={(event) => onChange(event.target.value)}
        className="kuteka-ops-input"
      />
    </label>
  );
}
