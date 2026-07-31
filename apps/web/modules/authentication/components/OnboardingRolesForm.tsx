'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { resolveSafeNextPath } from '@kuteka/auth';
import { onboardingRolesSchema, type SelfServeRoleCode } from '@kuteka/validation';
import { getAuthCopy } from '../content';
import { activateSelfServeRoles } from '../services/auth-client';
import { SubmitButton, type SubmitState } from './SubmitButton';

export function OnboardingRolesForm() {
  const copy = getAuthCopy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [roles, setRoles] = useState<SelfServeRoleCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('disabled');

  function toggle(role: SelfServeRoleCode) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  const formValid = onboardingRolesSchema.safeParse({ roles }).success;
  const effectiveState: SubmitState =
    submitState === 'loading' || submitState === 'success'
      ? submitState
      : formValid
        ? 'idle'
        : 'disabled';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = onboardingRolesSchema.safeParse({ roles });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.onboarding.roles.selectAtLeastOne);
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    const result = await activateSelfServeRoles(parsed.data.roles);
    if (!result.ok) {
      setError(result.message);
      setSubmitState('error');
      return;
    }

    setSubmitState('success');
    router.push(resolveSafeNextPath(next));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {error ? (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      ) : null}

      <div>
        <p className="font-medium text-white">{copy.onboarding.roles.title}</p>
        <p className="mt-1 text-sm text-slate-400">{copy.onboarding.roles.hint}</p>
      </div>

      <div
        className="rounded-kuteka border border-brand-400/35 bg-brand-500/10 px-4 py-3 text-sm leading-relaxed text-slate-100"
        role="note"
      >
        {copy.onboarding.roles.multiRole}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-kuteka border border-white/15 bg-white/[0.06] p-4 transition-colors hover:border-brand-400/50">
        <input
          type="checkbox"
          checked={roles.includes('client')}
          onChange={() => toggle('client')}
          className="mt-1 size-4 rounded border-white/30 bg-white/10 text-brand-600 focus:ring-brand-500"
        />
        <span>
          <span className="block font-medium text-white">
            <span aria-hidden="true" className="mr-1.5">
              🏠
            </span>
            {copy.onboarding.roles.client}
          </span>
          <span className="mt-0.5 block text-sm text-slate-300">
            {copy.onboarding.roles.clientDesc}
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-kuteka border border-white/15 bg-white/[0.06] p-4 transition-colors hover:border-brand-400/50">
        <input
          type="checkbox"
          checked={roles.includes('patrimonial_partner')}
          onChange={() => toggle('patrimonial_partner')}
          className="mt-1 size-4 rounded border-white/30 bg-white/10 text-brand-600 focus:ring-brand-500"
        />
        <span>
          <span className="block font-medium text-white">
            <span aria-hidden="true" className="mr-1.5">
              🏢
            </span>
            {copy.onboarding.roles.partner}
          </span>
          <span className="mt-0.5 block text-sm text-slate-300">
            {copy.onboarding.roles.partnerDesc}
          </span>
        </span>
      </label>

      <p className="text-sm text-slate-400">{copy.onboarding.roles.agentNote}</p>

      {!formValid && submitState !== 'loading' && submitState !== 'success' ? (
        <p className="text-sm text-slate-400">{copy.onboarding.roles.selectAtLeastOne}</p>
      ) : null}

      <SubmitButton
        state={effectiveState}
        idleLabel={copy.onboarding.roles.submit}
        loadingLabel={copy.onboarding.roles.submitLoading}
        successLabel={copy.onboarding.roles.success}
        className="min-h-12 w-full text-base"
        size="lg"
      />
    </form>
  );
}
