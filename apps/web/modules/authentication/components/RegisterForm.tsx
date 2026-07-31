'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert, Checkbox, Input, Label, Text } from '@kuteka/ui';
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
    const q = new URLSearchParams();
    q.set('email', parsed.data.email);
    if (next) q.set('next', next);
    router.push(`/auth/verificar?${q.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <Alert variant="danger">
          <p>{error}</p>
          {duplicate ? (
            <p className="mt-2 flex flex-wrap gap-3">
              <Link href="/auth/entrar" className="font-medium underline">
                {copy.register.duplicate.login}
              </Link>
              <Link href="/auth/recuperar" className="font-medium underline">
                {copy.register.duplicate.recover}
              </Link>
            </p>
          ) : null}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">{copy.register.email.label}</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
        <Text className="text-sm text-slate-500">{copy.register.email.hint}</Text>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password">{copy.register.password.label}</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
        <PasswordRules password={password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-confirm">{copy.register.confirm.label}</Label>
        <Input
          id="register-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(ev) => setConfirmPassword(ev.target.value)}
          required
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <Checkbox
          checked={termsAccepted}
          onChange={(ev) => setTermsAccepted(ev.target.checked)}
          className="mt-0.5"
          required
        />
        <span>
          {copy.register.terms.label}{' '}
          <Link href="/termos" className="text-brand-600 underline">
            {copy.register.terms.linkLabel}
          </Link>
        </span>
      </label>

      <SubmitButton
        state={effectiveState}
        idleLabel={copy.register.submit}
        loadingLabel={copy.register.submitLoading}
        successLabel={copy.register.submitSuccess}
        className="w-full"
      />

      <Text className="text-center text-sm text-slate-600">
        <Link href="/auth/entrar" className="font-medium text-brand-600 hover:underline">
          {copy.register.ctaLogin}
        </Link>
      </Text>
    </form>
  );
}
