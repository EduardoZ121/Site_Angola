'use client';

import { useState, type FormEvent } from 'react';
import { Button, Heading, Input, Label, Text } from '@kuteka/ui';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { PROVIDER_CATEGORIES } from '../lib/catalog';
import { registerServiceProvider } from '../services/monetization-client';
import { openingAllows } from '@/modules/kocc/lib/opening-settings';
import { ProviderNetworkNav } from './ProviderNetworkNav';

const PATH = ['Conta', 'Três dados', 'Aprovação', 'Activo'];

export function BecomeProviderClient() {
  const { status, error: sessionError } = useAppSession();
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('cleaning');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [more, setMore] = useState(false);
  const [nif, setNif] = useState('');
  const [owner, setOwner] = useState('');
  const [province, setProvince] = useState('Luanda');
  const [municipality, setMunicipality] = useState('');
  const [zones, setZones] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const gate = await openingAllows('providers_open');
    if (!gate.ok) {
      setError(gate.message);
      return;
    }
    setBusy(true);
    setError(null);
    const description = [
      about.trim(),
      nif.trim() ? `NIF: ${nif.trim()}` : '',
      owner.trim() ? `Responsável: ${owner.trim()}` : '',
      zones.trim() ? `Zonas: ${zones.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const res = await registerServiceProvider({
      businessName,
      category,
      description,
      phone,
      province,
      municipality,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDone(true);
  }

  return (
    <SessionStatusGate status={status} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Rede de prestadores</p>
          <Heading level={1}>Registar a empresa</Heading>
          <Text className="mt-1 text-slate-700">
            Três dados chegam. O pedido fica pendente até um Administrador, o Super Admin ou um Founder o activar. Não tem de ser o Owner. Não há pagamento neste passo.
          </Text>
          <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PATH.map((step, index) => (
              <li key={step} className="rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800">
                {index + 1}. {step}
              </li>
            ))}
          </ol>
          <div className="mt-4">
            <ProviderNetworkNav current="/app/servicos/tornar-se" />
          </div>
        </header>

        {done ? (
          <p className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Pedido enviado. Estado: Pendente. Não aparece ao público. A activação está em Administração → Aprovar prestadores. O papel de prestador entra quando essa activação estiver gravada na base.
          </p>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} className="kuteka-detail-panel grid gap-3 p-5">
            <div>
              <Label htmlFor="biz">Nome da empresa</Label>
              <Input id="biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required minLength={2} />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="cat">O que faz</Label>
              <select
                id="cat"
                className="mt-1 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {PROVIDER_CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="about">Em poucas linhas, o serviço</Label>
              <textarea
                id="about"
                required
                minLength={12}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Ex.: limpeza de apartamentos em Talatona, de segunda a sábado."
                className="mt-1 min-h-24 w-full rounded-kuteka border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              className="w-fit text-sm font-semibold text-[#08263f] underline-offset-2 hover:underline"
              onClick={() => setMore((open) => !open)}
            >
              {more ? 'Esconder dados opcionais' : 'NIF, zona e responsável (opcional)'}
            </button>
            {more ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="nif">NIF, se tiver</Label>
                  <Input id="nif" value={nif} onChange={(e) => setNif(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="owner">Responsável</Label>
                  <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="prov">Província</Label>
                  <Input id="prov" value={province} onChange={(e) => setProvince(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="muni">Município</Label>
                  <Input id="muni" value={municipality} onChange={(e) => setMunicipality(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="zones">Zonas onde trabalha</Label>
                  <Input id="zones" value={zones} onChange={(e) => setZones(e.target.value)} />
                </div>
              </div>
            ) : null}
            {error ? <p className="text-sm text-rose-800">{error}</p> : null}
            <Button type="submit" loading={busy}>
              Enviar para aprovação
            </Button>
          </form>
        )}
      </div>
    </SessionStatusGate>
  );
}
