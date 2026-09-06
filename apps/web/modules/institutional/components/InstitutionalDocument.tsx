'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '@/modules/shell/content';
import { parseMarkdownDocument, type MdBlock } from '../lib/parse-markdown';

export type DocumentDownload = {
  label: string;
  href: string;
};

type Props = {
  title: string;
  subtitle?: string;
  versionNote?: string;
  markdown: string;
  downloads: DocumentDownload[];
  backHref?: string;
  backLabel?: string;
};

function renderInline(text: string): ReactNode[] {
  // Bold, code, and markdown links [label](/path) or [label](https://...)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (!part) return null;
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
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch) {
      const label = linkMatch[1] ?? '';
      const href = linkMatch[2] ?? '';
      if (!label || !href) return <span key={i}>{part}</span>;
      const external = /^https?:\/\//i.test(href);
      if (external) {
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-700 underline underline-offset-2"
          >
            {label}
          </a>
        );
      }
      return (
        <Link
          key={i}
          href={href}
          className="font-medium text-brand-700 underline underline-offset-2"
        >
          {label}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function BlockView({ block }: { block: MdBlock }) {
  switch (block.type) {
    case 'h1':
      return null; // page title already shown
    case 'h2':
      return (
        <h2 className="mt-10 scroll-mt-24 border-b border-slate-200 pb-2 text-xl font-semibold text-slate-900">
          {renderInline(block.text)}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="mt-6 scroll-mt-24 text-lg font-semibold text-slate-800">
          {renderInline(block.text)}
        </h3>
      );
    case 'p':
      return (
        <p className="mt-3 text-[15px] leading-7 text-slate-700">{renderInline(block.text)}</p>
      );
    case 'quote':
      return (
        <blockquote className="mt-4 rounded-kuteka border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-slate-800">
          {renderInline(block.text)}
        </blockquote>
      );
    case 'ul':
      return (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-slate-700">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-slate-700">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="mt-4 overflow-x-auto rounded-kuteka border border-slate-200">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-100">
                {block.rows[0]?.map((cell, i) => (
                  <th
                    key={i}
                    className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-900"
                  >
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, r) => (
                <tr key={r} className="odd:bg-white even:bg-slate-50/80">
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className="border-b border-slate-100 px-3 py-2 align-top text-slate-700"
                    >
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
      return <hr className="my-8 border-slate-200" />;
    default:
      return null;
  }
}

export function InstitutionalDocument({
  title,
  subtitle,
  versionNote,
  markdown,
  downloads,
  backHref = '/',
  backLabel,
}: Props) {
  const { locale } = useLocale();
  const shellCopy = getShellCopy(locale);
  const shell = shellCopy.institutional;
  const pathname = usePathname();
  const blocks = parseMarkdownDocument(markdown).filter((b) => b.type !== 'h1');

  const legalLinks = [
    { href: '/termos', label: shellCopy.helpExtra.terms },
    { href: '/privacidade', label: shellCopy.helpExtra.privacy },
    { href: '/cookies', label: shellCopy.helpExtra.cookies },
  ].filter((link) => link.href !== pathname);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {shell.badge}
      </p>
      <Heading level={1} className="mt-2">
        {title}
      </Heading>
      {subtitle ? <Text className="mt-2 text-slate-600">{subtitle}</Text> : null}
      {versionNote ? <p className="mt-3 text-sm text-slate-500">{versionNote}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {downloads.map((d) => (
          <a
            key={d.href}
            href={d.href}
            download
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
          >
            {d.label}
          </a>
        ))}
      </div>

      <article className="mt-10">
        {blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </article>

      <div className="mt-12 border-t border-slate-200 pt-6">
        {legalLinks.length > 0 ? (
          <nav
            aria-label="Documentos legais relacionados"
            className="flex flex-wrap gap-x-5 gap-y-2"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href={backHref} className="text-sm font-medium text-brand-700 hover:underline">
            {backLabel ?? shell.backToLanding}
          </Link>
          <Link href="/contacto" className="text-sm text-slate-600 hover:underline">
            {shell.contactKuteka}
          </Link>
        </div>
      </div>
    </main>
  );
}
