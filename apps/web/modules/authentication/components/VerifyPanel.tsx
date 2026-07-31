'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { getAuthCopy } from '../content';
import { resendVerification } from '../services/auth-client';
import { applyDestinationGate } from '../lib/destination-gate';

const COOLDOWN_SECONDS = 60;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

export function VerifyPanel() {
  const copy = getAuthCopy();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const next = searchParams.get('next');
  const already = searchParams.get('confirmed') === '1';

  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onResend() {
    if (!email || cooldown > 0) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await resendVerification({ email });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.verify.resendSuccess);
    setCooldown(COOLDOWN_SECONDS);
  }

  if (already) {
    const ctaHref = applyDestinationGate({
      hasSession: true,
      emailVerified: true,
      roleCodes: [],
      next,
    });
    return (
      <div className="flex flex-col gap-6">
        <div
          className="rounded-kuteka border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-3 text-sm text-emerald-50"
          role="status"
        >
          {copy.verify.already.title}
        </div>
        <Link
          href={ctaHref}
          className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'min-h-12 w-full')}
        >
          {copy.verify.already.cta}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {email ? (
        <p className="text-sm text-slate-300">
          {copy.verify.sentTo}: <span className="font-medium text-white">{maskEmail(email)}</span>
        </p>
      ) : null}

      {message ? (
        <div
          className="rounded-kuteka border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-3 text-sm text-emerald-50"
          role="status"
        >
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="min-h-12 w-full"
        size="lg"
        loading={loading}
        disabled={loading || cooldown > 0 || !email}
        onClick={onResend}
      >
        {cooldown > 0
          ? copy.verify.cooldown.replace('{seconds}', String(cooldown))
          : copy.verify.resend}
      </Button>

      <p className="text-center text-sm text-slate-300">
        <Link href="/auth/entrar" className="auth-link">
          {copy.login.title}
        </Link>
      </p>
    </div>
  );
}
