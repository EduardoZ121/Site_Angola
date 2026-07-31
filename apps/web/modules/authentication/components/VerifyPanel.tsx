'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, Button, buttonVariants, Text } from '@kuteka/ui';
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
        <Alert variant="success">{copy.verify.already.title}</Alert>
        <Link href={ctaHref} className={cn(buttonVariants({ variant: 'primary' }), 'w-full')}>
          {copy.verify.already.cta}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {email ? (
        <Text className="text-sm text-slate-600">
          {copy.verify.sentTo}:{' '}
          <span className="font-medium text-slate-800">{maskEmail(email)}</span>
        </Text>
      ) : null}

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        loading={loading}
        disabled={loading || cooldown > 0 || !email}
        onClick={onResend}
      >
        {cooldown > 0
          ? copy.verify.cooldown.replace('{seconds}', String(cooldown))
          : copy.verify.resend}
      </Button>

      <Text className="text-center text-sm text-slate-500">
        <Link href="/auth/entrar" className="text-brand-600 hover:underline">
          {copy.login.title}
        </Link>
      </Text>
    </div>
  );
}
