import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RoleHelpRedirect } from '@/modules/institutional/components/RoleHelpRedirect';
import {
  HELP_ROLE_SLUGS,
  isHelpRoleSlug,
  type HelpRoleSlug,
} from '@/modules/institutional/lib/help-role';

type PageProps = {
  params: Promise<{ papel: string }> | { papel: string };
};

const ROLE_TITLES: Record<HelpRoleSlug, string> = {
  cliente: 'Cliente',
  parceiro: 'Parceiro Patrimonial',
  agente: 'Agente',
  prestador: 'Prestador',
  supervisor: 'Supervisor',
  admin: 'Administrador',
  super: 'Superadministrador',
  founder: 'Founder / Owner',
};

export function generateStaticParams() {
  return HELP_ROLE_SLUGS.map((papel) => ({ papel }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  if (!isHelpRoleSlug(resolved.papel)) return { title: 'Ajuda Kuteka' };
  return {
    title: `Ajuda Kuteka · ${ROLE_TITLES[resolved.papel]}`,
    robots: { index: false, follow: false },
  };
}

export default async function AjudaPorPapelPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  if (!isHelpRoleSlug(resolved.papel)) notFound();
  return <RoleHelpRedirect papel={resolved.papel} />;
}
