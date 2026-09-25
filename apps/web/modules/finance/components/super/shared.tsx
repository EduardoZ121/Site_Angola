'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

export type PanelProps = {
  canManage: boolean;
};

export function Metric({
  label,
  value,
  href,
  onOpen,
}: {
  label: string;
  value: string;
  href?: string;
  onOpen?: () => void;
}) {
  const body = (
    <>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      {href || onOpen ? <p className="mt-2 text-xs font-semibold text-[#08263f]">Abrir tratamento</p> : null}
    </>
  );
  const className =
    'rounded-kuteka border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-900';
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={`${className} w-full`}>
        {body}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} className={`${className} block`}>
        {body}
      </Link>
    );
  }
  return <div className="rounded-kuteka border border-slate-200 bg-slate-50 px-4 py-3">{body}</div>;
}

export function PanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="kuteka-detail-panel p-5">
      <h2 className="kuteka-detail-title">{title}</h2>
      {description ? <p className="kuteka-detail-body mt-1">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Feedback({ error, message }: { error?: string | null; message?: string | null }) {
  return (
    <>
      {error ? (
        <p className="rounded-kuteka border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-kuteka border border-emerald-300/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
    </>
  );
}

export function useFeedback() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  return { error, setError, message, setMessage, busy, setBusy };
}

export const selectClass =
  'w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm';
export const textareaClass =
  'w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm';
