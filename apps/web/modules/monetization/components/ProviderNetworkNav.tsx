'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';

export const PROVIDER_DOORS = [
  { href: '/app/servicos/rede', label: 'Rede' },
  { href: '/app/servicos/encontrar', label: 'Encontrar prestador' },
  { href: '/app/servicos/tornar-se', label: 'Tornar-se prestador' },
  { href: '/app/servicos/area', label: 'Área do prestador' },
  { href: '/app/servicos', label: 'Serviços' },
  { href: '/app/servicos/publicidade', label: 'Publicidade' },
  { href: '/app/servicos/campanhas', label: 'Campanhas' },
] as const;

export function ProviderNetworkNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Rede de prestadores">
      {PROVIDER_DOORS.map((door) => (
        <Link
          key={door.href}
          href={door.href}
          className={cn(
            buttonVariants({ variant: door.href === current ? 'primary' : 'secondary', size: 'sm' }),
          )}
        >
          {door.label}
        </Link>
      ))}
    </nav>
  );
}
