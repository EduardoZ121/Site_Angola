/**
 * Founder activation advice on top of the existing feature flags.
 * Does not create a second flag store. Critical items that must not be
 * switched on (real money, custody, Growth as a product, full delegation,
 * succession/board, AGT scraping) are holds: visible, not toggleable.
 */

export type ActivationAdvice = 'ACTIVAR' | 'AGUARDAR' | 'NAO_ACTIVAR';
export type ActivationRisk = 'baixo' | 'medio' | 'alto' | 'critico';

export type FlagActivation = {
  risk: ActivationRisk;
  blockers: string[];
  advice: ActivationAdvice;
  readiness: number;
  /** Re-enabling an existing flag needs a confirmation. Turning off never does. */
  confirmToEnable: boolean;
};

export type FounderHold = {
  key: string;
  label: string;
  advice: 'AGUARDAR' | 'NAO_ACTIVAR';
  readiness: number;
  why: string;
};

type KnownFlag = {
  risk: ActivationRisk;
  blockers: string[];
  confirmToEnable: boolean;
};

const KNOWN_FLAGS: Record<string, KnownFlag> = {
  kuteka_pay: {
    risk: 'critico',
    confirmToEnable: true,
    blockers: [
      'Ligado na Beta significa sandbox. Não movimenta dinheiro real nem custodia fundos.',
      'Pagamento real continua pendente de PSP, banco e validação jurídica.',
    ],
  },
  garantia: {
    risk: 'alto',
    confirmToEnable: true,
    blockers: ['Cobertura de Beta. Não é um seguro licenciado.'],
  },
  'security.sms_otp': {
    risk: 'alto',
    confirmToEnable: true,
    blockers: ['SMS continua em sandbox até haver um fornecedor em Angola.'],
  },
  'security.mfa_required_for_admin': {
    risk: 'alto',
    confirmToEnable: true,
    blockers: ['Exigir 2FA aos administradores pode bloquear quem ainda não o configurou.'],
  },
  kai_commercial: {
    risk: 'alto',
    confirmToEnable: true,
    blockers: ['Sugestões comerciais não autorizam preços nem comissões.'],
  },
  campaigns: {
    risk: 'alto',
    confirmToEnable: true,
    blockers: ['Créditos de campanha não são dinheiro e não entram no Kuteka Pay.'],
  },
  notifications: {
    risk: 'medio',
    confirmToEnable: false,
    blockers: ['O envio por SMS real ainda não tem fornecedor.'],
  },
};

const DEFAULT_FLAG: KnownFlag = {
  risk: 'medio',
  blockers: [],
  confirmToEnable: false,
};

export function adviseFlag(code: string, enabled: boolean): FlagActivation {
  const known = KNOWN_FLAGS[code] ?? DEFAULT_FLAG;
  const advice: ActivationAdvice = enabled
    ? known.risk === 'critico' || known.risk === 'alto'
      ? 'AGUARDAR'
      : 'ACTIVAR'
    : known.confirmToEnable
      ? 'AGUARDAR'
      : 'ACTIVAR';
  const readiness = enabled
    ? known.risk === 'critico'
      ? 55
      : known.risk === 'alto'
        ? 75
        : known.blockers.length > 0
          ? 80
          : 92
    : known.confirmToEnable
      ? 40
      : 70;
  return { ...known, advice, readiness };
}

export function adviceLabel(advice: ActivationAdvice): string {
  if (advice === 'ACTIVAR') return 'Pode estar activo na Beta';
  if (advice === 'AGUARDAR') return 'Teste sim — comércio real, não';
  return 'Não activar';
}

/**
 * Decisions the Founder must see, and that must not become a second flag
 * the interface could flip on. The existing modules stay where they are.
 */
export const FOUNDER_ACTIVATION_HOLDS: FounderHold[] = [
  {
    key: 'pay_real',
    label: 'Kuteka Pay real e custódia de fundos',
    advice: 'NAO_ACTIVAR',
    readiness: 20,
    why: 'O motor em sandbox já existe (flag Kuteka Pay). Dinheiro real e custódia de clientes não se ligam: falta PSP, banco e parecer. Não foi criado um segundo sistema de pagamento.',
  },
  {
    key: 'growth_engine',
    label: 'Growth Engine como produto',
    advice: 'AGUARDAR',
    readiness: 15,
    why: 'Referral, recompensas e campanhas públicas ficam adormecidos. Activar agora duplicaria o que o KOCC já controla, sem métricas suficientes.',
  },
  {
    key: 'delegation',
    label: 'Delegação completa, sucessão e Board',
    advice: 'NAO_ACTIVAR',
    readiness: 10,
    why: 'Os papéis operacionais já existem. CEO, Chairman, Board e sucessão automática não se criam nesta Beta.',
  },
  {
    key: 'agt',
    label: 'Facturação AGT e recolha automática',
    advice: 'NAO_ACTIVAR',
    readiness: 5,
    why: 'Não há scraping da AGT nem facturas fictícias. A facturação real espera software validado e o contabilista.',
  },
  {
    key: 'company_code',
    label: 'Segundo código do perfil da empresa',
    advice: 'AGUARDAR',
    readiness: 80,
    why: 'O cofre já está gravado. Só o Founder Owner cria o código em Empresa. Sem isso, o IBAN e o Facebook não ficam substituíveis.',
  },
];
