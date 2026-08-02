import { describe, expect, it } from 'vitest';
import { buildKaiInsights } from './kai-insights';
import type { OpsStats } from './types';

function baseStats(partial: Partial<OpsStats> = {}): OpsStats {
  return {
    users: 10,
    trustPending: 1,
    interests: 2,
    clientContracts: [],
    paymentsPaid: 0,
    paymentsPending: 0,
    paymentsLate: 0,
    maintenanceOpen: 0,
    propertiesTotal: 3,
    propertiesActive: 3,
    propertiesOccupied: 2,
    propertiesAvailable: 1,
    propertiesFutureFree: 1,
    vacantDaysEstimate: 40,
    monthlyRevenueAoa: 500000,
    annualRevenueAoa: 6000000,
    partnerContractsActive: 2,
    partnerContractsExpiring: 1,
    pipelineInterests: 5,
    pipelineVisits30: 3,
    pipelineProposals30: 1,
    reviewAvg: 4.5,
    reviews: 4,
    futureProperties: [
      {
        id: 'p1',
        title: 'T3 Talatona',
        code: 'KTK-1',
        city: 'Luanda',
        expectedAvailableOn: '2026-09-15',
        availabilityNote: 'Saída prevista',
        daysUntilFree: 42,
      },
    ],
    assignments: 4,
    agentContracts: 2,
    contractsActiveTotal: 8,
    contractsCompletedTotal: 3,
    partnersCount: 2,
    clientsCount: 5,
    agentsCount: 1,
    occupancyPct: 66,
    avgDaysToFree: 42,
    ...partial,
  };
}

describe('KAI insights', () => {
  it('predicts partner vacancy', () => {
    const insights = buildKaiInsights('patrimonial_partner', baseStats());
    expect(insights.some((i) => i.title.includes('42'))).toBe(true);
  });

  it('surfaces client contract countdown', () => {
    const insights = buildKaiInsights(
      'client',
      baseStats({
        clientContracts: [
          {
            id: 'c1',
            code: 'C-1',
            status: 'active',
            purpose: 'rent',
            amountAoa: 1200000,
            startsOn: '2025-01-01',
            endsOn: '2026-09-01',
            depositAoa: 100000,
            nextPaymentDue: '2026-08-05',
            nextPaymentAmountAoa: 100000,
            exitIntent: 'none',
            exitIntentDate: null,
            exitReason: null,
            propertyId: 'p1',
            propertyTitle: 'Casa',
            propertyCode: 'KTK',
            daysRemaining: 30,
            daysUntilPayment: 3,
            lateDays: 0,
          },
        ],
      }),
    );
    expect(insights.some((i) => i.id === 'c-days')).toBe(true);
  });
});
