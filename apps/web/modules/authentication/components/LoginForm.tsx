'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert, Input, Label } from '@kuteka/ui';
import { loginSchema } from '@kuteka/validation';
import { canAccessAdminPanel } from '@kuteka/auth';
import { getAuthCopy } from '../content';
import { applyDestinationGate } from '../lib/destination-gate';
import { signIn } from '../services/auth-client';
import { isSupabaseConfigured } from '../lib/supabase-config';
import { createBrowserClient } from '@/lib/supabase/client';
import { fetchAuthorizationContext } from '@kuteka/database';
import { SubmitButton, type SubmitState } from './SubmitButton';

export function LoginForm() {
  const copy = getAuthCopy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('disabled');

  const formValid = loginSchema.safeParse({ email, password }).success;
  const effectiveState: SubmitState =
    submitState === 'loading' || submitState === 'success'
      ? submitState
      : formValid
        ? 'idle'
        : 'disabled';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.login.errorGeneric);
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    const result = await signIn(parsed.data);
    if (!result.ok) {
      setError(result.message);
      setSubmitState('error');
      return;
    }

    setSubmitState('success');

    let destination = applyDestinationGate({
      hasSession: true,
      emailVerified: true,
      roleCodes: [],
      next,
    });

    if (isSupabaseConfigured()) {
      try {
        const client = createBrowserClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (user) {
          const verified = Boolean(user.email_confirmed_at);
          let roleCodes: string[] = [];
          let hasAdminPanel = false;
          if (verified) {
            try {
              const ctx = await fetchAuthorizationContext(client, user.id, user.email ?? null);
              roleCodes = ctx.roles;
              hasAdminPanel = canAccessAdminPanel(ctx);
            } catch {
              roleCodes = [];
            }
          }
          destination = applyDestinationGate({
            hasSession: true,
            emailVerified: verified,
            roleCodes,
            hasAdminPanel,
            next,
          });
        }
      } catch {
        // Keep default gate destination
      }
    }

    router.push(destination);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">{copy.login.email.label}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">{copy.login.password.label}</Label>
          <button
            type="button"
            className="text-xs font-medium text-brand-600 hover:underline"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? copy.common.hidePassword : copy.login.password.show}
          </button>
        </div>
        <Input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
      </div>

      <SubmitButton
        state={effectiveState}
        idleLabel={copy.login.submit}
        loadingLabel={copy.login.submitLoading}
        successLabel={copy.login.submitSuccess}
        className="w-full"
      />

      <div className="flex flex-wrap justify-between gap-3 text-sm">
        <Link href="/auth/recuperar" className="text-brand-600 hover:underline">
          {copy.login.ctaRecover}
        </Link>
        <Link href="/auth/registar" className="font-medium text-brand-600 hover:underline">
          {copy.login.ctaRegister}
        </Link>
      </div>
    </form>
  );
}
