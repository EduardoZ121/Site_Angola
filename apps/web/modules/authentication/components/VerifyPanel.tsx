'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase-config';
import { resolveEmailVerified } from '../lib/destination-gate';
import { Button, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '../content';
import {
  issueEmailVerificationOtp,
  resendVerification,
  verifyEmailOtpCode,
} from '../services/auth-client';
import { applyDestinationGate } from '../lib/destination-gate';

const COOLDOWN_SECONDS = 60;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

export function VerifyPanel() {
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';
  const next = searchParams.get('next');
  const already = searchParams.get('confirmed') === '1';
  const [email, setEmail] = useState(emailParam);

  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sandboxHint, setSandboxHint] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      try {
        const client = createBrowserClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (cancelled || !user) return;
        if (!emailParam && user.email) setEmail(user.email);
        const { data: profile } = await client
          .from('profiles')
          .select('email_verified_at')
          .eq('id', user.id)
          .maybeSingle();
        const verified = resolveEmailVerified({
          authConfirmedAt: user.email_confirmed_at,
          profileVerifiedAt: profile?.email_verified_at ?? null,
        });
        if (!verified) return;
        const { data: roleCodes } = await client.rpc('get_user_role_codes', {
          p_user_id: user.id,
        });
        const dest = applyDestinationGate({
          hasSession: true,
          emailVerified: true,
          roleCodes: Array.isArray(roleCodes) ? roleCodes.filter((r): r is string => typeof r === 'string') : [],
          next,
        });
        router.replace(dest);
      } catch {
        /* stay on verify */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [emailParam, next, router]);

  async function onResend() {
    if (!email || cooldown > 0) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    setSandboxHint(null);

    const otpIssue = await issueEmailVerificationOtp({ email });
    if (!otpIssue.ok) {
      const fallback = await resendVerification({ email });
      setLoading(false);
      if (!fallback.ok) {
        setError(fallback.message);
        return;
      }
      setMessage(copy.verify.resendSuccess);
      setCooldown(COOLDOWN_SECONDS);
      return;
    }

    setLoading(false);
    if (otpIssue.data.challengeId) setChallengeId(otpIssue.data.challengeId);
    if (otpIssue.data.sandboxCode) {
      setSandboxHint(copy.verify.sandboxHint.replace('{code}', otpIssue.data.sandboxCode));
    }
    setMessage(copy.verify.resendSuccess);
    setCooldown(COOLDOWN_SECONDS);
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!email || otp.replace(/\D/g, '').length !== 6) return;
    setVerifying(true);
    setError(null);
    const result = await verifyEmailOtpCode({ email, code: otp, challengeId });
    setVerifying(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const ctaHref = applyDestinationGate({
      hasSession: true,
      emailVerified: true,
      roleCodes: [],
      next,
    });
    router.push(ctaHref);
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

      <p className="text-sm leading-relaxed text-slate-300">{copy.verify.dualHint}</p>

      {message ? (
        <div
          className="rounded-kuteka border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-3 text-sm text-emerald-50"
          role="status"
        >
          {message}
        </div>
      ) : null}
      {sandboxHint ? (
        <div
          className="rounded-kuteka border border-amber-400/35 bg-amber-500/15 px-3.5 py-3 text-sm text-amber-50"
          role="status"
        >
          {sandboxHint}
        </div>
      ) : null}
      {error ? (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={onVerifyOtp} className="flex flex-col gap-3">
        <label htmlFor="verify-otp" className="auth-label">
          {copy.verify.otpLabel}
        </label>
        <input
          id="verify-otp"
          className="auth-field tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder={copy.verify.otpPlaceholder}
          value={otp}
          onChange={(ev) => setOtp(ev.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={!email}
        />
        <Button
          type="submit"
          variant="primary"
          className="min-h-12 w-full"
          size="lg"
          loading={verifying}
          disabled={verifying || !email || otp.length !== 6}
        >
          {copy.verify.otpSubmit}
        </Button>
      </form>

      <div className="relative py-1 text-center text-xs uppercase tracking-wide text-slate-500">
        <span>{copy.verify.orLink}</span>
      </div>

      <p className="text-center text-sm text-slate-400">{copy.verify.linkHint}</p>

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
