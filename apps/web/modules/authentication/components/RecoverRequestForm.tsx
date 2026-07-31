'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { recoverSchema } from '@kuteka/validation';
import { getAuthCopy } from '../content';
import { resetPasswordForEmail } from '../services/auth-client';
import { SubmitButton, type SubmitState } from './SubmitButton';

export function RecoverRequestForm() {
  const copy = getAuthCopy();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('disabled');

  const formValid = recoverSchema.safeParse({ email }).success;
  const effectiveState: SubmitState =
    submitState === 'loading' || submitState === 'success'
      ? submitState
      : success
        ? 'success'
        : formValid
          ? 'idle'
          : 'disabled';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = recoverSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.common.networkError);
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/recuperar/confirmar`
        : undefined;

    const result = await resetPasswordForEmail({
      email: parsed.data.email,
      redirectTo,
    });

    if (!result.ok && (result.code === 'network' || result.code === 'rate_limited')) {
      setError(result.message);
      setSubmitState('error');
      return;
    }

    setSuccess(true);
    setSubmitState('success');
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="rounded-kuteka border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-3 text-sm text-emerald-50"
          role="status"
        >
          {copy.recover.request.success}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="recover-email" className="auth-label">
          {copy.recover.request.email.label}
        </label>
        <input
          id="recover-email"
          className="auth-field"
          type="email"
          autoComplete="email"
          placeholder="nome@email.com"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
          disabled={success}
        />
      </div>

      <SubmitButton
        state={effectiveState}
        idleLabel={copy.recover.request.submit}
        loadingLabel={copy.recover.request.submitLoading}
        successLabel={copy.recover.request.submit}
        className="min-h-12 w-full text-base"
        size="lg"
      />

      <div className="flex flex-col gap-2 text-sm text-slate-300">
        <Link href="/auth/entrar" className="auth-link">
          {copy.recover.request.back}
        </Link>
        <Link href="/contacto" className="text-slate-400 hover:text-slate-200 hover:underline">
          {copy.recover.request.noemail}
        </Link>
      </div>
    </form>
  );
}
