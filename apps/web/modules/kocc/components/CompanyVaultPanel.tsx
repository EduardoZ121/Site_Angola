'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@kuteka/ui';
import { PUBLISHED_COMPANY_CONTACTS } from '@/lib/official-company';
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

const CONTACT_FIELDS: {
  key: keyof CompanyProfileInput;
  label: string;
  autoComplete?: string;
  maxLength?: number;
}[] = [
  { key: 'email', label: 'Email geral', autoComplete: 'email' },
  { key: 'privacyEmail', label: 'Email de privacidade', autoComplete: 'email' },
  { key: 'legalEmail', label: 'Email jurídico', autoComplete: 'email' },
  { key: 'website', label: 'Site', autoComplete: 'url', maxLength: 200 },
  { key: 'phone', label: 'Telefone oficial', autoComplete: 'tel' },
  { key: 'phoneSecondary', label: 'Segundo telefone', autoComplete: 'tel' },
  { key: 'whatsapp', label: 'WhatsApp Business', autoComplete: 'tel' },
  { key: 'facebook', label: 'Facebook', autoComplete: 'url', maxLength: 200 },
  { key: 'address', label: 'Endereço', maxLength: 240 },
];

const BANK_FIELDS: { key: keyof CompanyProfileInput; label: string }[] = [
  { key: 'bankName', label: 'Banco' },
  { key: 'iban', label: 'IBAN da empresa' },
  { key: 'accountNumber', label: 'Número da conta' },
  { key: 'accountHolder', label: 'Titular' },
  { key: 'currency', label: 'Moeda' },
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
          Contactos oficiais da Kuteka. O telefone é +244 957 871 557. O segundo telefone e o
          WhatsApp Business são +244 935 404 400. O Facebook fica vazio até colar a página. Banco e
          IBAN ainda não existem. Só o Founder Owner substitui estes dados, com um segundo código
          verificado no servidor. Não é a senha da conta e não fica guardado neste browser.
        </p>
      </div>

      <PublishedContacts />

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
          <p className="text-sm font-semibold text-slate-800">Contactos oficiais</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CONTACT_FIELDS.map((field) => (
              <ProfileField
                key={field.key}
                label={field.label}
                value={profile[field.key]}
                autoComplete={field.autoComplete}
                maxLength={field.maxLength ?? 120}
                onChange={(value) => setProfile((prev) => ({ ...prev, [field.key]: value }))}
              />
            ))}
          </div>
          <p className="text-sm font-semibold text-slate-800">Dados bancários da empresa</p>
          <p className="text-sm text-slate-600">
            Ainda não havia banco nem IBAN publicados. Preencha quando quiser. Continuam invisíveis
            no site público.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {BANK_FIELDS.map((field) => (
              <ProfileField
                key={field.key}
                label={field.label}
                value={profile[field.key]}
                maxLength={120}
                onChange={(value) => setProfile((prev) => ({ ...prev, [field.key]: value }))}
              />
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

function PublishedContacts() {
  const published = PUBLISHED_COMPANY_CONTACTS;
  const rows = [
    ['Email geral', published.email],
    ['Privacidade', published.privacyEmail],
    ['Jurídico', published.legalEmail],
    ['Site', published.website],
    ['Telefone', published.phone],
    ['Segundo telefone / WhatsApp Business', published.phoneSecondary],
    ['Facebook', 'Campo pronto — ainda sem página'],
    ['Endereço', 'Ainda não publicado'],
    ['Banco e IBAN', 'Ainda não existem'],
  ];
  return (
    <div className="rounded-kuteka border border-slate-200 bg-white px-3 py-3">
      <p className="text-sm font-semibold text-slate-900">O que já estava espalhado no site</p>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </dt>
            <dd className="text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  autoComplete,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  maxLength: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <input
        value={value}
        autoComplete={autoComplete ?? 'off'}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="kuteka-ops-input"
      />
    </label>
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
