'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { canAccessAdminPanel } from '@kuteka/auth';
import { fetchAuthorizationContext } from '@kuteka/database';
import { newPasswordSchema, passwordRules } from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '../content';
import { applyDestinationGate } from '../lib/destination-gate';
import { isSupabaseConfigured } from '../lib/supabase-config';
import { updatePassword } from '../services/auth-client';
import { PasswordRules } from './PasswordRules';
import { SubmitButton, type SubmitState } from './SubmitButton';

export function RecoverConfirmForm() {
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('disabled');

  const formValid =
    newPasswordSchema.safeParse({ password, confirmPassword }).success &&
    passwordRules.isValid(password);

  const effectiveState: SubmitState =
    submitState === 'loading' || submitState === 'success'
      ? submitState
      : formValid
        ? 'idle'
        : 'disabled';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = newPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.common.networkError);
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    const result = await updatePassword({ password: parsed.data.password });
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
        // keep default
      }
    }

    router.push(destination);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="new-password" className="auth-label">
            {copy.recover.confirm.password.label}
          </label>
          <button
            type="button"
            className="text-xs font-medium text-brand-400 hover:text-brand-300"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? copy.common.hidePassword : copy.common.showPassword}
          </button>
        </div>
        <input
          id="new-password"
          className="auth-field"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
        <PasswordRules password={password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password-confirm" className="auth-label">
          {copy.recover.confirm.confirm.label}
        </label>
        <input
          id="new-password-confirm"
          className="auth-field"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(ev) => setConfirmPassword(ev.target.value)}
          required
        />
      </div>

      <SubmitButton
        state={effectiveState}
        idleLabel={copy.recover.confirm.submit}
        loadingLabel={copy.recover.confirm.submitLoading}
        successLabel={copy.recover.confirm.submitSuccess}
        className="min-h-12 w-full text-base"
        size="lg"
      />
    </form>
  );
}
