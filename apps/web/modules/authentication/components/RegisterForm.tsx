'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { passwordRules, registerSchema } from '@kuteka/validation';
import { getAuthCopy } from '../content';
import { signUp } from '../services/auth-client';
import { PasswordRules } from './PasswordRules';
import { SubmitButton, type SubmitState } from './SubmitButton';

export function RegisterForm() {
  const copy = getAuthCopy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('disabled');

  const formValid =
    registerSchema.safeParse({
      email,
      password,
      confirmPassword,
      termsAccepted: termsAccepted ? true : false,
    }).success && passwordRules.isValid(password);

  const effectiveState: SubmitState =
    submitState === 'loading' || submitState === 'success'
      ? submitState
      : formValid
        ? 'idle'
        : 'disabled';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDuplicate(false);

    const parsed = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
      termsAccepted: termsAccepted ? true : false,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.common.networkError);
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/verificar${next ? `?next=${encodeURIComponent(next)}` : ''}`
        : undefined;

    const result = await signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      emailRedirectTo: redirectTo,
    });

    if (!result.ok) {
      if (result.code === 'duplicate_email') {
        setDuplicate(true);
        setError(result.message);
      } else {
        setError(result.message);
      }
      setSubmitState('error');
      return;
    }

    setSubmitState('success');
    if (result.data.needsEmailVerification) {
      const q = new URLSearchParams();
      q.set('email', parsed.data.email);
      if (next) q.set('next', next);
      router.push(`/auth/verificar?${q.toString()}`);
      return;
    }

    // Autoconfirm: prefer onboarding when session exists; otherwise enter with same email.
    if (result.data.hasSession) {
      const dest = next
        ? `/auth/onboarding/papeis?next=${encodeURIComponent(next)}`
        : '/auth/onboarding/papeis';
      router.push(dest);
      return;
    }

    const q = new URLSearchParams();
    if (next) q.set('next', next);
    router.push(`/auth/entrar${q.toString() ? `?${q}` : ''}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <div className="auth-alert" role="alert">
          <p>{error}</p>
          {duplicate ? (
            <p className="mt-2 flex flex-wrap gap-4">
              <Link href="/auth/entrar" className="auth-link">
                {copy.register.duplicate.login}
              </Link>
              <Link href="/auth/recuperar" className="auth-link">
                {copy.register.duplicate.recover}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-email" className="auth-label">
          {copy.register.email.label}
        </label>
        <input
          id="register-email"
          className="auth-field"
          type="email"
          autoComplete="email"
          placeholder={copy.register.email.placeholder}
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
        <p className="text-sm text-slate-400">{copy.register.email.hint}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-password" className="auth-label">
          {copy.register.password.label}
        </label>
        <input
          id="register-password"
          className="auth-field"
          type="password"
          autoComplete="new-password"
          placeholder={copy.register.password.placeholder}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
        <PasswordRules password={password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-confirm" className="auth-label">
          {copy.register.confirm.label}
        </label>
        <input
          id="register-confirm"
          className="auth-field"
          type="password"
          autoComplete="new-password"
          placeholder={copy.register.confirm.placeholder}
          value={confirmPassword}
          onChange={(ev) => setConfirmPassword(ev.target.value)}
          required
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(ev) => setTermsAccepted(ev.target.checked)}
          className="mt-1 size-4 rounded border-white/30 bg-white/10 text-brand-600 focus:ring-brand-500"
          required
        />
        <span>
          {copy.register.terms.label}{' '}
          <Link href="/termos" className="auth-link">
            {copy.register.terms.linkLabel}
          </Link>
        </span>
      </label>

      <SubmitButton
        state={effectiveState}
        idleLabel={copy.register.submit}
        loadingLabel={copy.register.submitLoading}
        successLabel={copy.register.submitSuccess}
        className="mt-1 min-h-12 w-full text-base"
        size="lg"
      />

      <p className="text-center text-sm text-slate-300">
        <Link href="/auth/entrar" className="auth-link">
          {copy.register.ctaLogin}
        </Link>
      </p>
    </form>
  );
}
