'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useSyncExternalStore } from 'react';
import { getAuthCopy } from '../content';
import { isPublicSupabaseConfigured } from '../lib/public-config';

function subscribe() {
  return () => undefined;
}

function getSnapshot() {
  return isPublicSupabaseConfigured();
}

function getServerSnapshot() {
  return false;
}

/** Client stub chrome for /app — adapts when kuteka-config.js has Supabase keys. */
export function AppHomeClient({ displayName }: { displayName: string | null }) {
  const configured = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const copy = getAuthCopy();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Heading level={1}>{copy.app.title}</Heading>
        {displayName ? (
          <Text className="text-lg text-slate-700">
            {copy.app.welcome}, {displayName}
          </Text>
        ) : (
          <Text className="text-lg text-slate-700">{copy.app.welcome}</Text>
        )}
        <Text className="text-slate-600">{copy.app.active}</Text>
      </div>

      {!configured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Backend de autenticação ainda não ligado</p>
          <p className="mt-1 text-amber-900/90">{copy.app.configMissing}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Text className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Em preparação
        </Text>
        <ul className="flex flex-col gap-2 text-slate-700">
          <li className="border-b border-slate-100 py-3">Patrimónios — activar e acompanhar</li>
          <li className="border-b border-slate-100 py-3">Confiança — documentos e verificação</li>
          <li className="border-b border-slate-100 py-3">Habitação — jornada do Cliente</li>
        </ul>
        <Text className="text-sm text-slate-500">{copy.app.stub}</Text>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Voltar à Landing
        </Link>
        {!configured ? (
          <Link href="/auth/registar" className={cn(buttonVariants({ variant: 'primary' }))}>
            Ver fluxo Criar conta
          </Link>
        ) : null}
      </div>
    </div>
  );
}
