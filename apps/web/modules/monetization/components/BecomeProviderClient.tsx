'use client';

import { useState, type FormEvent } from 'react';
import { Button, Heading, Input, Label, Text } from '@kuteka/ui';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { PROVIDER_CATEGORIES } from '../lib/catalog';
import { registerServiceProvider } from '../services/monetization-client';
import { ProviderNetworkNav } from './ProviderNetworkNav';

const STEPS = [
  'Quero ser prestador',
  'Registo',
  'Dados profissionais',
  'Categoria',
  'Análise do Founder',
  'Activo',
];

export function BecomeProviderClient() {
  const { status, error: sessionError } = useAppSession();
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('cleaning');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('Luanda');
  const [municipality, setMunicipality] = useState('');
  const [nif, setNif] = useState('');
  const [owner, setOwner] = useState('');
  const [zones, setZones] = useState('');
  const [hours, setHours] = useState('');
  const [serviceMode, setServiceMode] = useState('Orçamento');
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const description = [
      about.trim(),
      nif.trim() ? `NIF: ${nif.trim()}` : '',
      owner.trim() ? `Responsável: ${owner.trim()}` : '',
      zones.trim() ? `Zonas: ${zones.trim()}` : '',
      hours.trim() ? `Horário: ${hours.trim()}` : '',
      `Atendimento: ${serviceMode}`,
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
          <Heading level={1}>Tornar-se prestador</Heading>
          <Text className="mt-1 text-slate-700">
            O pedido fica pendente. Não aparece ao público até o Founder o activar. Não há pagamento neste passo.
          </Text>
          <ol className="mt-4 grid gap-2 sm:grid-cols-3">
            {STEPS.map((step, index) => (
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
            Pedido enviado. Estado: Pendente. O Founder vê-o na Área do prestador e decide se passa a Activo.
          </p>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} className="kuteka-detail-panel grid gap-3 p-5">
            <div>
              <Label htmlFor="biz">Nome da empresa ou profissional</Label>
              <Input id="biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required minLength={2} />
            </div>
            <div>
              <Label htmlFor="cat">Categoria</Label>
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
              <p className="mt-1 text-xs text-slate-500">
                Catering, frio, piscinas, mobiliário, logística e construção: escolha Outros e descreva o serviço.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="nif">NIF, se tiver</Label>
                <Input id="nif" value={nif} onChange={(e) => setNif(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="owner">Responsável</Label>
                <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="muni">Município</Label>
                <Input id="muni" value={municipality} onChange={(e) => setMunicipality(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="prov">Província</Label>
                <Input id="prov" value={province} onChange={(e) => setProvince(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="zones">Zonas onde trabalha</Label>
                <Input id="zones" value={zones} onChange={(e) => setZones(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="hours">Horário</Label>
                <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="mode">Forma de atendimento</Label>
                <select
                  id="mode"
                  className="mt-1 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={serviceMode}
                  onChange={(e) => setServiceMode(e.target.value)}
                >
                  <option>Orçamento</option>
                  <option>Visita</option>
                  <option>Remoto</option>
                  <option>No local</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="about">Descrição, experiência e serviços</Label>
              <textarea
                id="about"
                required
                minLength={12}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="mt-1 min-h-28 w-full rounded-kuteka border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            {error ? <p className="text-sm text-rose-800">{error}</p> : null}
            <Button type="submit" loading={busy}>
              Enviar para análise
            </Button>
          </form>
        )}
      </div>
    </SessionStatusGate>
  );
}
