'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Alert, Input, Label } from '@kuteka/ui';
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

    if (!result.ok && result.code === 'network') {
      setError(result.message);
      setSubmitState('error');
      return;
    }

    // R6 — generic success regardless of whether email exists
    setSuccess(true);
    setSubmitState('success');
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {success ? <Alert variant="success">{copy.recover.request.success}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="recover-email">{copy.recover.request.email.label}</Label>
        <Input
          id="recover-email"
          type="email"
          autoComplete="email"
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
        className="w-full"
      />

      <div className="flex flex-col gap-2 text-sm">
        <Link href="/auth/entrar" className="text-brand-600 hover:underline">
          {copy.recover.request.back}
        </Link>
        <Link href="/contacto" className="text-slate-500 hover:underline">
          {copy.recover.request.noemail}
        </Link>
      </div>
    </form>
  );
}
