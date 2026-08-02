'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';

type Stat = { label: string; value: string };
type LinkItem = { href: string; label: string; primary?: boolean };

export function OpsCockpitShell({
  eyebrow,
  title,
  subtitle,
  stats,
  links,
  loading,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: Stat[];
  links: LinkItem[];
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="kuteka-detail-panel p-5" aria-label={title}>
      <p className="kuteka-detail-eyebrow">{eyebrow}</p>
      <h2 className="kuteka-detail-title mt-1">{title}</h2>
      <p className="kuteka-detail-body mt-1">{subtitle}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className="kuteka-role-stat">
            <p className="kuteka-role-stat__value">{loading ? '…' : stat.value}</p>
            <p className="kuteka-role-stat__label">{stat.label}</p>
          </li>
        ))}
      </ul>
      {children}
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className={cn(
              buttonVariants({ variant: link.primary ? 'primary' : 'secondary', size: 'sm' }),
              'w-fit',
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
