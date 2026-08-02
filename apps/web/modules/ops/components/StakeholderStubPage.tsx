'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';

type StubProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets: string[];
};

export function StakeholderStubPage({ eyebrow, title, subtitle, bullets }: StubProps) {
  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">{eyebrow}</p>
        <Heading level={1}>{title}</Heading>
        <Text className="mt-1 text-slate-700">{subtitle}</Text>
      </header>
      <section className="kuteka-detail-panel p-5">
        <ul className="flex flex-col gap-2">
          {bullets.map((item) => (
            <li key={item} className="kuteka-ops-block">
              <p className="kuteka-ops-block__title">{item}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/app"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-4 w-fit')}
        >
          Voltar ao cockpit
        </Link>
      </section>
    </div>
  );
}
