import { createBrowserClient } from '@/lib/supabase/client';
import { daysBetween, parseDate } from './format';
import type { OpsContract, OpsFutureProperty, OpsStats } from './types';

function emptyStats(): OpsStats {
  return {
    users: 0,
    trustPending: 0,
    interests: 0,
    clientContracts: [],
    paymentsPaid: 0,
    paymentsPending: 0,
    paymentsLate: 0,
    maintenanceOpen: 0,
    propertiesTotal: 0,
    propertiesActive: 0,
    propertiesOccupied: 0,
    propertiesAvailable: 0,
    propertiesFutureFree: 0,
    vacantDaysEstimate: 0,
    monthlyRevenueAoa: 0,
    annualRevenueAoa: 0,
    partnerContractsActive: 0,
    partnerContractsExpiring: 0,
    pipelineInterests: 0,
    pipelineVisits30: 0,
    pipelineProposals30: 0,
    reviewAvg: null,
    reviews: 0,
    futureProperties: [],
    assignments: 0,
    agentContracts: 0,
    contractsActiveTotal: 0,
    contractsCompletedTotal: 0,
    partnersCount: 0,
    clientsCount: 0,
    agentsCount: 0,
    occupancyPct: null,
    avgDaysToFree: null,
  };
}

function mapContract(row: Record<string, unknown>, today: Date): OpsContract {
  const prop = row.properties as
    | { title?: string | null; code?: string | null }
    | { title?: string | null; code?: string | null }[]
    | null;
  const property = Array.isArray(prop) ? prop[0] : prop;
  const endsOn = typeof row.ends_on === 'string' ? row.ends_on : null;
  const nextDue = typeof row.next_payment_due === 'string' ? row.next_payment_due : null;
  const ends = parseDate(endsOn);
  const due = parseDate(nextDue);
  return {
    id: String(row.id),
    code: typeof row.code === 'string' ? row.code : null,
    status: String(row.status ?? ''),
    purpose: String(row.purpose ?? ''),
    amountAoa: Number(row.amount_aoa ?? 0),
    startsOn: typeof row.starts_on === 'string' ? row.starts_on : null,
    endsOn,
    depositAoa: row.deposit_aoa != null ? Number(row.deposit_aoa) : null,
    nextPaymentDue: nextDue,
    nextPaymentAmountAoa:
      row.next_payment_amount_aoa != null ? Number(row.next_payment_amount_aoa) : null,
    exitIntent: String(row.exit_intent ?? 'none'),
    exitIntentDate: typeof row.exit_intent_date === 'string' ? row.exit_intent_date : null,
    exitReason: typeof row.exit_reason === 'string' ? row.exit_reason : null,
    propertyId: String(row.property_id),
    propertyTitle: property?.title ?? null,
    propertyCode: property?.code ?? null,
    daysRemaining: ends ? daysBetween(today, ends) : null,
    daysUntilPayment: due ? daysBetween(today, due) : null,
    lateDays: due && daysBetween(today, due) < 0 ? Math.abs(daysBetween(today, due)) : 0,
  };
}

export async function loadOpsStats(uid: string): Promise<OpsStats> {
  const client = createBrowserClient();
  const today = new Date();
  const stats = emptyStats();

  try {
    const [
      clientContractsRes,
      partnerContractsRes,
      propsRes,
      interestsRes,
      maintRes,
      assignmentsRes,
      profilesRes,
      trustRes,
      futureRes,
      allActiveContractsRes,
      allCompletedRes,
    ] = await Promise.all([
      client
        .from('property_contracts')
        .select(
          'id,code,status,purpose,amount_aoa,starts_on,ends_on,deposit_aoa,next_payment_due,next_payment_amount_aoa,exit_intent,exit_intent_date,exit_reason,property_id,properties(title,code)',
        )
        .eq('client_id', uid)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(20),
      client
        .from('property_contracts')
        .select(
          'id,code,status,purpose,amount_aoa,starts_on,ends_on,deposit_aoa,next_payment_due,next_payment_amount_aoa,exit_intent,exit_intent_date,property_id,properties(title,code)',
        )
        .eq('partner_id', uid)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(40),
      client
        .from('properties')
        .select(
          'id,status,lifecycle_status,expected_available_on,availability_note,title,code,city',
        )
        .eq('owner_id', uid)
        .is('deleted_at', null)
        .limit(80),
      client
        .from('property_interests')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', uid),
      client
        .from('maintenance_requests')
        .select('id,status', { count: 'exact' })
        .or(`client_id.eq.${uid},partner_id.eq.${uid}`)
        .limit(40),
      client
        .from('agent_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', uid)
        .eq('status', 'active'),
      client.from('profiles').select('id', { count: 'exact', head: true }),
      client
        .from('trust_documents')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review']),
      client
        .from('properties')
        .select('id,title,code,city,expected_available_on,availability_note')
        .not('expected_available_on', 'is', null)
        .gte('expected_available_on', today.toISOString().slice(0, 10))
        .is('deleted_at', null)
        .order('expected_available_on', { ascending: true })
        .limit(12),
      client
        .from('property_contracts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null),
      client
        .from('property_contracts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .is('deleted_at', null),
    ]);

    const clientRows = (clientContractsRes.data as Record<string, unknown>[] | null) ?? [];
    const partnerRows = (partnerContractsRes.data as Record<string, unknown>[] | null) ?? [];
    const propRows = (propsRes.data as Record<string, unknown>[] | null) ?? [];
    const futureRows = (futureRes.data as Record<string, unknown>[] | null) ?? [];

    stats.clientContracts = clientRows.map((row) => mapContract(row, today));
    stats.interests = interestsRes.count ?? 0;
    stats.assignments = assignmentsRes.count ?? 0;
    stats.users = profilesRes.count ?? 0;
    stats.trustPending = trustRes.count ?? 0;
    stats.contractsActiveTotal = allActiveContractsRes.count ?? 0;
    stats.contractsCompletedTotal = allCompletedRes.count ?? 0;

    const maintRows = (maintRes.data as { id: string; status: string }[] | null) ?? [];
    stats.maintenanceOpen = maintRows.filter((m) =>
      ['requested', 'scheduled', 'in_progress'].includes(m.status),
    ).length;

    // payments for first client contract
    const primaryContract = stats.clientContracts.find((c) => c.status === 'active');
    if (primaryContract) {
      const { data: pays } = await client
        .from('contract_payments')
        .select('id,status,late_days')
        .eq('contract_id', primaryContract.id)
        .limit(40);
      const payRows = (pays as { status: string; late_days: number }[] | null) ?? [];
      stats.paymentsPaid = payRows.filter((p) => p.status === 'paid').length;
      stats.paymentsPending = payRows.filter((p) => p.status === 'pending').length;
      stats.paymentsLate = payRows.filter((p) => p.status === 'late' || p.late_days > 0).length;
    }

    stats.propertiesTotal = propRows.length;
    stats.propertiesActive = propRows.filter((p) => String(p.status) === 'active').length;
    const occupiedStatuses = new Set(['arrendado', 'vendido', 'reservado', 'em_negociacao']);
    stats.propertiesOccupied = propRows.filter((p) =>
      occupiedStatuses.has(String(p.lifecycle_status ?? '')),
    ).length;
    // fallback: active rent contracts as occupied
    const partnerActive = partnerRows.filter((c) => String(c.status) === 'active');
    if (stats.propertiesOccupied === 0 && partnerActive.length) {
      stats.propertiesOccupied = new Set(partnerActive.map((c) => String(c.property_id))).size;
    }
    stats.propertiesAvailable = Math.max(0, stats.propertiesActive - stats.propertiesOccupied);
    stats.partnerContractsActive = partnerActive.length;
    stats.partnerContractsExpiring = partnerActive.filter((c) => {
      const ends = parseDate(typeof c.ends_on === 'string' ? c.ends_on : null);
      if (!ends) return false;
      const d = daysBetween(today, ends);
      return d >= 0 && d <= 60;
    }).length;

    const monthly = partnerActive.reduce((sum, c) => {
      const amount = Number(c.next_payment_amount_aoa ?? 0);
      if (amount > 0) return sum + amount;
      return sum + Number(c.amount_aoa ?? 0) / 12;
    }, 0);
    stats.monthlyRevenueAoa = Math.round(monthly);
    stats.annualRevenueAoa = Math.round(monthly * 12);

    const propIds = propRows.map((p) => String(p.id));
    if (propIds.length) {
      const [metricsRes, interestsPipe, reviewsRes] = await Promise.all([
        client
          .from('property_metrics')
          .select('visits_30d,proposals_30d')
          .in('property_id', propIds),
        client
          .from('property_interests')
          .select('id', { count: 'exact', head: true })
          .in('property_id', propIds),
        client.from('contract_reviews').select('rating').in('property_id', propIds),
      ]);
      for (const m of (metricsRes.data as { visits_30d: number; proposals_30d: number }[]) ?? []) {
        stats.pipelineVisits30 += Number(m.visits_30d) || 0;
        stats.pipelineProposals30 += Number(m.proposals_30d) || 0;
      }
      stats.pipelineInterests = interestsPipe.count ?? 0;
      const ratings = ((reviewsRes.data as { rating: number }[]) ?? []).map((r) =>
        Number(r.rating),
      );
      stats.reviews = ratings.length;
      stats.reviewAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    }

    stats.futureProperties = futureRows
      .map((row): OpsFutureProperty | null => {
        const date =
          typeof row.expected_available_on === 'string' ? row.expected_available_on : null;
        const d = parseDate(date);
        if (!date || !d) return null;
        return {
          id: String(row.id),
          title: typeof row.title === 'string' ? row.title : null,
          code: typeof row.code === 'string' ? row.code : null,
          city: typeof row.city === 'string' ? row.city : null,
          expectedAvailableOn: date,
          availabilityNote:
            typeof row.availability_note === 'string' ? row.availability_note : null,
          daysUntilFree: daysBetween(today, d),
        };
      })
      .filter((x): x is OpsFutureProperty => Boolean(x));

    stats.propertiesFutureFree = stats.futureProperties.length;
    if (stats.futureProperties.length) {
      stats.avgDaysToFree = Math.round(
        stats.futureProperties.reduce((a, p) => a + p.daysUntilFree, 0) /
          stats.futureProperties.length,
      );
      stats.vacantDaysEstimate = stats.futureProperties.reduce(
        (a, p) => a + Math.max(0, p.daysUntilFree),
        0,
      );
    }

    if (stats.propertiesActive > 0) {
      stats.occupancyPct = Math.round((stats.propertiesOccupied / stats.propertiesActive) * 100);
    }

    // agent contracts
    const { count: agentContractCount } = await client
      .from('property_contracts')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', uid)
      .is('deleted_at', null);
    stats.agentContracts = agentContractCount ?? 0;

    // role counts via user_roles if readable — fallback approximate
    try {
      const { data: roleRows } = await client.from('roles').select('id,code');
      const roles = (roleRows as { id: string; code: string }[] | null) ?? [];
      const byCode = Object.fromEntries(roles.map((r) => [r.code, r.id]));
      async function countRole(code: string): Promise<number> {
        const id = byCode[code];
        if (!id) return 0;
        const { count } = await client
          .from('user_roles')
          .select('user_id', { count: 'exact', head: true })
          .eq('role_id', id);
        return count ?? 0;
      }
      stats.clientsCount = await countRole('client');
      stats.partnersCount = await countRole('patrimonial_partner');
      stats.agentsCount = await countRole('certified_agent');
    } catch {
      /* RLS may block — keep zeros */
    }

    return stats;
  } catch {
    return stats;
  }
}
