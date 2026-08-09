'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AppSessionData } from '@/modules/authentication/components/app-session';
import { getIdentidadeCopy } from '@/modules/identidade/content';
import { buildKisKaiSuggestions } from '@/modules/identidade/lib/trust-center';
import { loadMyIdentity } from '@/modules/identidade/services/identity-client';
import { KaiInsightCards } from '@/modules/ops/components/KaiInsightCards';
import {
  AdminOpsCockpit,
  AgentOpsCockpit,
  ClientOpsCockpit,
  FutureAvailabilityList,
  PartnerOpsCockpit,
} from '@/modules/ops/components/StakeholderCockpits';
import { buildKaiInsights } from '@/modules/ops/kai-insights';
import { loadOpsStats } from '@/modules/ops/load-ops-stats';
import type { KaiInsight, OpsStats } from '@/modules/ops/types';
import { experienceLabel, modeBadgeLabel } from '@/modules/i18n/experience-labels';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { createBrowserClient } from '@/lib/supabase/client';
import { getShellCopy } from '../content';
import type { ExperienceMode } from '../role-experience';
import { FlowNextSteps, type FlowStep } from './FlowNextSteps';
import { useRoleExperience } from './RoleExperienceProvider';
import { operatingProfileFor, ROLE_HOME_CTA_LABELS_PT } from '../role-operating-matrix';

function firstActionSteps(mode: ExperienceMode): FlowStep[] {
  return operatingProfileFor(mode).homeCtas.map((cta) => ({
    href: cta.href,
    label: ROLE_HOME_CTA_LABELS_PT[cta.labelKey],
    primary: Boolean(cta.primary),
  }));
}

type RoleHomeDashboardProps = {
  session: AppSessionData;
};

function panelsForMode(mode: ExperienceMode, s: OpsStats | null, loading: boolean) {
  switch (mode) {
    case 'client':
      return (
        <>
          <ClientOpsCockpit s={s} loading={loading} />
          <FutureAvailabilityList s={s} />
        </>
      );
    case 'patrimonial_partner':
      return (
        <>
          <PartnerOpsCockpit s={s} loading={loading} />
          <FutureAvailabilityList s={s} />
        </>
      );
    case 'client_partner':
      return (
        <>
          <ClientOpsCockpit s={s} loading={loading} />
          <PartnerOpsCockpit s={s} loading={loading} />
          <FutureAvailabilityList s={s} />
        </>
      );
    case 'certified_agent':
      return (
        <>
          <AgentOpsCockpit s={s} loading={loading} />
          <FutureAvailabilityList s={s} />
        </>
      );
    case 'supervisor':
    case 'administrator':
      return <AdminOpsCockpit s={s} loading={loading} />;
    case 'super_administrator':
      return <AdminOpsCockpit s={s} loading={loading} executive />;
    default:
      return <ClientOpsCockpit s={s} loading={loading} />;
  }
}

/**
 * Operational intelligence home — stakeholder cockpits + KAI.
 */
export function RoleHomeDashboard({ session }: RoleHomeDashboardProps) {
  const { mode } = useRoleExperience();
  const { locale } = useLocale();
  const [stats, setStats] = useState<OpsStats | null>(null);
  const [kisInsights, setKisInsights] = useState<KaiInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const client = createBrowserClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setStats(null);
          setKisInsights([]);
          setLoading(false);
        }
        return;
      }
      const [data, identity] = await Promise.all([loadOpsStats(user.id), loadMyIdentity()]);
      if (!cancelled) {
        setStats(data);
        setKisInsights(
          identity.ok ? buildKisKaiSuggestions(identity.data, getIdentidadeCopy(locale)) : [],
        );
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [session.roles, mode, locale]);

  const insights = useMemo(() => {
    const ops = stats ? buildKaiInsights(mode, stats) : [];
    return [...kisInsights, ...ops].slice(0, 5);
  }, [kisInsights, mode, stats]);

  const shell = getShellCopy(locale);
  const firstSteps = firstActionSteps(mode);

  return (
    <div className="flex flex-col gap-4">
      {mode === 'client_partner' ? (
        <p className="kuteka-detail-meta px-1">
          {modeBadgeLabel('client_partner', locale)} — {experienceLabel('client_partner', locale)}
        </p>
      ) : null}
      <FlowNextSteps
        title={shell.firstActions.title}
        kaiHint={shell.firstActions.kaiHint}
        steps={firstSteps}
      />
      <KaiInsightCards insights={insights} />
      {panelsForMode(mode, stats, loading)}
    </div>
  );
}
