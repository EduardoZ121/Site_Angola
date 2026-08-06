'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';
import { parseMarkdownDocument, type MdBlock } from '@/modules/institutional/lib/parse-markdown';

type Props = {
  manualMarkdown: string;
};

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function BlockView({ block }: { block: MdBlock }) {
  switch (block.type) {
    case 'h1':
      return null;
    case 'h2':
      return (
        <h2 className="kuteka-detail-title mt-8 scroll-mt-24 border-b border-slate-200 pb-2">
          {renderInline(block.text)}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="mt-5 scroll-mt-24 text-base font-semibold text-slate-900">
          {renderInline(block.text)}
        </h3>
      );
    case 'p':
      return <p className="mt-2 text-sm leading-6 text-slate-700">{renderInline(block.text)}</p>;
    case 'quote':
      return (
        <blockquote className="mt-3 rounded-kuteka border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-slate-800">
          {renderInline(block.text)}
        </blockquote>
      );
    case 'ul':
      return (
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="mt-3 overflow-x-auto rounded-kuteka border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100">
                {block.rows[0]?.map((cell, i) => (
                  <th key={i} className="px-3 py-2 font-semibold text-slate-900">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, r) => (
                <tr key={r} className="odd:bg-white even:bg-slate-50">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2 align-top text-slate-700">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'hr':
      return <hr className="my-6 border-slate-200" />;
    default:
      return null;
  }
}

export function HelpCenterClient({ manualMarkdown }: Props) {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const h = shell.helpPage;
  const blocks = parseMarkdownDocument(manualMarkdown).filter((b) => b.type !== 'h1');

  const topics = [
    { label: h.manual, href: '#manual' },
    { label: h.faq, href: '#faq' },
    { label: h.howPublish, href: '/app/patrimonios/novo' },
    { label: h.howBuy, href: '/app/habitacao/explorar' },
    { label: h.howRent, href: '/app/habitacao/explorar' },
    { label: shell.helpExtra.terms, href: '/termos' },
    { label: shell.helpExtra.privacy, href: '/privacidade' },
    { label: shell.helpExtra.securityCenter, href: '/app/centro-seguranca' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">{shell.userMenu.help}</p>
        <Heading level={1}>{h.title}</Heading>
        <Text className="mt-1 text-slate-700">{h.subtitle}</Text>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/docs/MANUAL_UTILIZADOR_v1.pdf"
            download
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
          >
            {shell.helpExtra.downloadManualPdf}
          </a>
          <a
            href="/docs/MANUAL_UTILIZADOR_v1.docx"
            download
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
          >
            {shell.helpExtra.downloadManualWord}
          </a>
        </div>
      </header>

      <section className="kuteka-detail-panel p-5" aria-label="Atalhos">
        <ul className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.label}>
              <Link href={topic.href} className="kuteka-detail-fact block p-4 hover:bg-amber-50/60">
                <p className="font-bold text-slate-900">{topic.label}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="kuteka-detail-panel p-5" id="manual">
        <article>
          {blocks.map((block, i) => {
            const isFaq = block.type === 'h2' && block.text.toLowerCase().includes('faq');
            return (
              <div key={i} id={isFaq ? 'faq' : undefined}>
                <BlockView block={block} />
              </div>
            );
          })}
        </article>
      </section>

      <section className="kuteka-detail-panel flex flex-col gap-3 p-5" id="videos">
        <h2 className="kuteka-detail-title">{h.videos}</h2>
        <p className="kuteka-detail-body">{shell.helpExtra.videosPending}</p>
        <Link
          href="/contacto"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
        >
          {h.contactCta}
        </Link>
      </section>
    </div>
  );
}
