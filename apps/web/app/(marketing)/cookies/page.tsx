import type { Metadata } from 'next';
import { InstitutionalDocument } from '@/modules/institutional/components/InstitutionalDocument';
import { readPublicDoc } from '@/modules/institutional/lib/read-public-doc';

export const metadata: Metadata = {
  title: 'Política de Cookies · Kuteka',
  description:
    'Política de Cookies da Kuteka — tipos de cookies, finalidades e como gerir as suas preferências na plataforma.',
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  const markdown = readPublicDoc('POLITICA_COOKIES_v1.md');
  return (
    <InstitutionalDocument
      title="Política de Cookies"
      subtitle="Como a Kuteka utiliza cookies e tecnologias similares, e como pode gerir as suas preferências."
      versionNote="Versão 1.0 Beta · Vigência 5 de Agosto de 2026 · privacidade@kutekalink.com"
      markdown={markdown}
      downloads={[
        { label: 'Descarregar PDF', href: '/docs/POLITICA_COOKIES_v1.pdf' },
        { label: 'Descarregar Word', href: '/docs/POLITICA_COOKIES_v1.docx' },
        { label: 'Markdown', href: '/docs/POLITICA_COOKIES_v1.md' },
      ]}
    />
  );
}
