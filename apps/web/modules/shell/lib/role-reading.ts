import type { ExperienceMode } from '../role-experience';

export type ReadingDoc = {
  id: string;
  title: string;
  href: string;
  note?: string;
};

type ReadingSpec = ReadingDoc & {
  roles: readonly ExperienceMode[] | 'all';
};

/** Documents that already exist. Nothing here is a new law or an approved opinion. */
const CATALOG: readonly ReadingSpec[] = [
  {
    id: 'manual',
    title: 'Manual do utilizador',
    href: '/app/ajuda?sec=manual',
    roles: 'all',
  },
  {
    id: 'termos',
    title: 'Termos de utilização',
    href: '/termos',
    note: 'Texto publicado. A aprovação formal continua na mesa do jurista.',
    roles: 'all',
  },
  {
    id: 'privacidade',
    title: 'Política de privacidade',
    href: '/privacidade',
    roles: 'all',
  },
  {
    id: 'glossario',
    title: 'Glossário',
    href: '/app/ajuda?sec=glossario',
    roles: 'all',
  },
  {
    id: 'processos',
    title: 'Processos, acesso e continuidade',
    href: '/app/processos',
    roles: [
      'founder',
      'super_administrator',
      'administrator',
      'supervisor',
      'accountant',
      'certified_agent',
    ],
  },
  {
    id: 'contabilista',
    title: 'Pacote do contabilista (minuta)',
    href: '/documentacao/contabilista',
    note: 'Não é lei nem parecer aprovado.',
    roles: ['accountant', 'founder', 'super_administrator'],
  },
  {
    id: 'jurista',
    title: 'Pacote do jurista (minuta)',
    href: '/documentacao/jurista',
    note: 'Não é lei nem parecer aprovado.',
    roles: ['founder', 'accountant', 'super_administrator', 'administrator'],
  },
];

export const DOC_READ_KEY = 'kuteka-doc-read';

export function readingDocsFor(mode: ExperienceMode): ReadingDoc[] {
  return CATALOG.filter((doc) => doc.roles === 'all' || doc.roles.includes(mode)).map(
    ({ roles: _roles, ...doc }) => doc,
  );
}

export function parseDocRead(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const out: Record<string, string> = {};
    for (const [key, stamp] of Object.entries(value)) {
      if (typeof stamp === 'string' && key.length > 0 && key.length < 80) out[key] = stamp;
    }
    return out;
  } catch {
    return {};
  }
}

export function unreadReading(mode: ExperienceMode, ack: Record<string, string>): ReadingDoc[] {
  return readingDocsFor(mode).filter((doc) => !ack[doc.id]);
}
