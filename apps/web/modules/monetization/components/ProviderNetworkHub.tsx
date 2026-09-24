'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PROVIDER_CATEGORIES } from '../lib/catalog';
import { ProviderNetworkNav } from './ProviderNetworkNav';

const ECOSYSTEM = [
  'Catering',
  'Refrigeração',
  'Limpeza',
  'Remodelação',
  'Mudanças',
  'Jardinagem',
  'Piscinas',
  'Segurança',
  'Mobiliário',
  'Manutenção',
  'Logística',
  'Construção',
];

/**
 * Entrada da rede que já existe em service_providers.
 * Não cria um segundo marketplace.
 */
export function ProviderNetworkHub() {
  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">Ecossistema · Habitação e património</p>
        <Heading level={1}>Prestadores de Serviços</Heading>
        <Text className="mt-1 text-slate-700">
          Uma empresa ou um profissional entra, é aprovado pelo Founder e apresenta serviços ligados
          à casa. Serviço, publicação e publicidade são três coisas diferentes.
        </Text>
        <div className="mt-4">
          <ProviderNetworkNav current="/app/servicos/rede" />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="kuteka-detail-panel p-5">
          <h2 className="text-sm font-semibold text-slate-900">1. Serviço</h2>
          <p className="mt-1 text-sm text-slate-700">O prestador executa o trabalho e recebe o pedido.</p>
          <Link href="/app/servicos" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-3')}>
            Abrir serviços
          </Link>
        </article>
        <article className="kuteka-detail-panel p-5">
          <h2 className="text-sm font-semibold text-slate-900">2. Publicação</h2>
          <p className="mt-1 text-sm text-slate-700">A ficha mostra quem é, onde trabalha e o que faz.</p>
          <Link href="/app/servicos/encontrar" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3')}>
            Encontrar prestador
          </Link>
        </article>
        <article className="kuteka-detail-panel p-5">
          <h2 className="text-sm font-semibold text-slate-900">3. Publicidade</h2>
          <p className="mt-1 text-sm text-slate-700">
            Destaque e campanha aumentam a visibilidade. O preço não está fixo e o pagamento real está desligado.
          </p>
          <Link href="/app/servicos/publicidade" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3')}>
            Ver publicidade
          </Link>
        </article>
        <article className="kuteka-detail-panel p-5">
          <h2 className="text-sm font-semibold text-slate-900">Entrar na rede</h2>
          <p className="mt-1 text-sm text-slate-700">
            Pedido → análise do Founder → activo. Enquanto está pendente, a ficha não aparece ao público.
          </p>
          <Link href="/app/servicos/tornar-se" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3')}>
            Tornar-se prestador
          </Link>
        </article>
      </section>

      <section className="kuteka-detail-panel p-5">
        <h2 className="text-sm font-semibold text-slate-900">Categorias do ecossistema</h2>
        <p className="mt-1 text-sm text-slate-600">
          Limpeza, mudanças, remodelação, jardinagem e segurança já têm código próprio. Catering, frio,
          piscinas, mobiliário, logística e construção entram em Outros até o Founder alargar o catálogo.
          A comissão não está escrita nesta página: segue a regra já configurável.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ECOSYSTEM.map((name) => (
            <li key={name} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800">
              {name}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {PROVIDER_CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
            <Link
              key={c.value}
              href={`/app/servicos/encontrar?categoria=${c.value}`}
              className="text-sm text-slate-700 underline"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
