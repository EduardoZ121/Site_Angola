'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { getAuthCopy } from '../content';
import { updateDisplayName } from '../services/auth-client';
import { SubmitButton, type SubmitState } from './SubmitButton';

export function OnboardingProfileForm() {
  const copy = getAuthCopy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  function rolesHref() {
    const q = next ? `?next=${encodeURIComponent(next)}` : '';
    return `/auth/onboarding/papeis${q}`;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = displayName.trim();
    if (!trimmed) {
      router.push(rolesHref());
      return;
    }

    setSubmitState('loading');
    const result = await updateDisplayName(trimmed);
    if (!result.ok) {
      setError(result.message);
      setSubmitState('error');
      return;
    }

    setSubmitState('success');
    router.push(rolesHref());
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="display-name" className="auth-label">
          {copy.onboarding.profile.displayName.label}
        </label>
        <input
          id="display-name"
          className="auth-field"
          type="text"
          autoComplete="nickname"
          placeholder="Como prefere ser chamado"
          value={displayName}
          onChange={(ev) => setDisplayName(ev.target.value)}
          maxLength={120}
        />
      </div>

      <SubmitButton
        state={submitState === 'loading' || submitState === 'success' ? submitState : 'idle'}
        idleLabel={copy.onboarding.profile.submit}
        loadingLabel={copy.onboarding.profile.submitLoading}
        className="min-h-12 w-full text-base"
        size="lg"
      />

      <p className="text-center text-sm">
        <Link href={rolesHref()} className="auth-link">
          {copy.onboarding.profile.skip}
        </Link>
      </p>
    </form>
  );
}
