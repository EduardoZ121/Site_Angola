'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';

const LINKS = [
  { href: '/app/aprovacoes', title: 'Minutas para aprovar', hint: 'Pacote do contabilista e pacote do jurista, com parecer.' },
  { href: '/documentacao/jurista', title: 'Pacote do jurista', hint: 'Perguntas em aberto. Não é parecer.' },
  { href: '/documentacao/contabilista', title: 'Pacote do contabilista', hint: 'Fecho, leitura e limites do papel.' },
  { href: '/termos', title: 'Termos de Utilização', hint: 'Texto publicado. O jurista diz se pode continuar.' },
  { href: '/privacidade', title: 'Privacidade', hint: 'Texto publicado. Sem inventar uma regra nova.' },
  { href: '/cookies', title: 'Cookies', hint: 'Texto publicado.' },
  { href: '/app/contratos', title: 'Contratos na plataforma', hint: 'Relações já abertas. Não substitui instrumento assinado fora.' },
  { href: '/app/centro-confianca', title: 'Centro de Confiança', hint: 'Identidade e reputação. O contabilista não vê o processo completo.' },
  { href: '/documentacao', title: 'Manual e ajuda', hint: 'O que o utilizador já consegue fazer.' },
];

export function LegalDeskClient() {
  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">Jurídico</p>
        <Heading level={1}>Mesa do jurista</Heading>
        <Text className="mt-1 text-slate-700">
          Os textos estão publicados para leitura. Nada aqui é parecer, lei ou pagamento. O advogado aprova ou pede alterações.
        </Text>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="kuteka-detail-panel block p-4 hover:border-slate-400">
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/app/aprovacoes" className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}>
        Registar parecer
      </Link>
    </div>
  );
}
