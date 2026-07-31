'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert, Checkbox, Text } from '@kuteka/ui';
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
      setError(parsed.error.issues[0]?.message ?? copy.common.networkError);
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
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div>
        <Text className="font-medium text-slate-900">{copy.onboarding.roles.title}</Text>
        <Text className="mt-1 text-sm text-slate-500">{copy.onboarding.roles.hint}</Text>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-kuteka border border-slate-200 bg-white/60 p-4 transition-colors hover:border-brand-300">
        <Checkbox
          checked={roles.includes('client')}
          onChange={() => toggle('client')}
          className="mt-1"
        />
        <span>
          <span className="block font-medium text-slate-900">{copy.onboarding.roles.client}</span>
          <span className="mt-0.5 block text-sm text-slate-600">
            {copy.onboarding.roles.clientDesc}
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-kuteka border border-slate-200 bg-white/60 p-4 transition-colors hover:border-brand-300">
        <Checkbox
          checked={roles.includes('patrimonial_partner')}
          onChange={() => toggle('patrimonial_partner')}
          className="mt-1"
        />
        <span>
          <span className="block font-medium text-slate-900">{copy.onboarding.roles.partner}</span>
          <span className="mt-0.5 block text-sm text-slate-600">
            {copy.onboarding.roles.partnerDesc}
          </span>
        </span>
      </label>

      <Text className="text-sm leading-relaxed text-slate-600">
        {copy.onboarding.roles.multiRole}
      </Text>
      <Text className="text-sm text-slate-500">{copy.onboarding.roles.agentNote}</Text>

      <SubmitButton
        state={effectiveState}
        idleLabel={copy.onboarding.roles.submit}
        loadingLabel={copy.onboarding.roles.submitLoading}
        successLabel={copy.onboarding.roles.success}
        className="w-full"
      />
    </form>
  );
}
