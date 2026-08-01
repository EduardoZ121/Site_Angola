'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Heading, Text, Input, Label, Textarea, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PROPERTY_PURPOSES, PROPERTY_TYPES } from '@kuteka/validation';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { getPatrimoniosCopy } from '../content/pt';
import { activateProperty } from '../services/properties-client';
import type { LocalMediaDraft } from '../services/property-media-client';
import { PropertyMediaEditor } from './PropertyMediaEditor';

export function ActivatePropertyForm() {
  const copy = getPatrimoniosCopy();
  const router = useRouter();
  const { session, status } = useAppSession();
  const canManage = session?.permissions.includes('properties.manage') ?? false;

  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPES)[number]>('apartment');
  const [purpose, setPurpose] = useState<(typeof PROPERTY_PURPOSES)[number]>('rent');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [notes, setNotes] = useState('');
  const [priceAoa, setPriceAoa] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [media, setMedia] = useState<LocalMediaDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'ready' && !canManage) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.activate}</Heading>
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {copy.needPartner}
        </div>
        <Link
          href="/auth/onboarding/papeis"
          className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
        >
          {copy.activateRole}
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const price = priceAoa.trim() ? Number(priceAoa.replace(/\s/g, '')) : null;
    const beds = bedrooms.trim() ? Number(bedrooms) : null;
    const result = await activateProperty(
      {
        title,
        propertyType,
        purpose,
        province,
        city,
        addressLine,
        notes,
        priceAoa: price != null && !Number.isNaN(price) ? price : null,
        bedrooms: beds != null && !Number.isNaN(beds) ? beds : null,
        status: 'active',
      },
      media,
    );
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/app/patrimonios/detalhe?id=${result.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="kuteka-glass flex flex-col gap-2 p-5">
        <Heading level={1}>{copy.activate}</Heading>
        <Text className="text-slate-600">{copy.mvpNote}</Text>
      </header>

      {error ? (
        <div
          className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="kuteka-glass flex flex-col gap-6 p-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">{copy.fields.title}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={copy.fields.titlePlaceholder}
            required
            minLength={3}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">{copy.fields.type}</Label>
            <select
              id="type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as (typeof PROPERTY_TYPES)[number])}
              className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {copy.types[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purpose">{copy.fields.purpose}</Label>
            <select
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as (typeof PROPERTY_PURPOSES)[number])}
              className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {PROPERTY_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {copy.purposes[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">{copy.fields.price}</Label>
            <Input
              id="price"
              inputMode="numeric"
              value={priceAoa}
              onChange={(e) => setPriceAoa(e.target.value)}
              placeholder={copy.fields.pricePlaceholder}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bedrooms">{copy.fields.bedrooms}</Label>
            <Input
              id="bedrooms"
              inputMode="numeric"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder="4"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="province">{copy.fields.province}</Label>
            <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">{copy.fields.city}</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address">{copy.fields.address}</Label>
          <Input
            id="address"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">{copy.fields.notes}</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <PropertyMediaEditor value={media} onChange={setMedia} disabled={submitting} />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={cn(buttonVariants({ variant: 'primary' }))}
          >
            {submitting ? copy.activating : copy.activate}
          </button>
          <Link
            href="/app/habitacao/explorar"
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            Ver inventário Cliente
          </Link>
        </div>
      </form>

      <FlowNextSteps
        title="Fluxo após publicação"
        steps={[
          { href: '/app/habitacao/explorar', label: 'Ver no inventário', primary: true },
          { href: '/app/confianca', label: 'Documentos & Confiança' },
          { href: '/app/contratos', label: 'Preparar contrato' },
          { href: '/app/agente', label: 'Área do Agente' },
        ]}
      />
    </div>
  );
}
