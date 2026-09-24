'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { ProviderNetworkNav } from './ProviderNetworkNav';

const MOTORS = [
  {
    title: '1. Comissão',
    body: 'O prestador conclui o serviço e a Kuteka fica com a percentagem da categoria. O número não está fixo nesta página.',
  },
  {
    title: '2. Publicidade',
    body: 'Pagar para promover a empresa dentro de habitação, mudança, manutenção e serviços. Não é um mural livre.',
  },
  {
    title: '3. Destaque',
    body: 'Pagar para subir na categoria durante 3, 7, 15 ou 30 dias. O preço é do Founder. Ainda não há cobrança.',
  },
  {
    title: '4. Campanhas',
    body: 'Oferta do prestador, por exemplo um desconto no mês. Nasce inactiva e o Founder publica.',
  },
  {
    title: '5. Assinatura profissional',
    body: 'Free, Professional e Business ficam preparados. Não há plano à venda nesta Beta.',
  },
  {
    title: '6. Publicidade B2B',
    body: 'Empresas do ecossistema podem anunciar. Também sem preço fixo e sem pagamento real.',
  },
];

export function ProviderAdsClient() {
  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">Publicidade · preparada, não activa</p>
        <Heading level={1}>Publicidade e destaque</Heading>
        <Text className="mt-1 text-slate-700">
          O prestador vê o caminho. O dinheiro real, o preço e a duração oficial ficam com o Founder.
          Nada nesta página cobra Kz.
        </Text>
        <div className="mt-4">
          <ProviderNetworkNav current="/app/servicos/publicidade" />
        </div>
      </header>
      <section className="grid gap-3 sm:grid-cols-2">
        {MOTORS.map((motor) => (
          <article key={motor.title} className="kuteka-detail-panel p-5">
            <h2 className="text-sm font-semibold text-slate-900">{motor.title}</h2>
            <p className="mt-1 text-sm text-slate-700">{motor.body}</p>
          </article>
        ))}
      </section>
      <section className="kuteka-detail-panel p-5 text-sm text-slate-700">
        <p>Fluxo quando o pagamento existir: criar → KAI → Founder → pagamento → publicação → fim → relatório.</p>
        <p className="mt-2">Nesta Beta o passo de pagamento está bloqueado. A campanha pode ser criada inactiva.</p>
        <Link href="/app/servicos/campanhas" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-4')}>
          Abrir campanhas
        </Link>
      </section>
    </div>
  );
}
