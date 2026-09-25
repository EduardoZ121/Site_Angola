import { createBrowserClient } from '@/lib/supabase/client';
import { listFeatureFlags, setFeatureFlag } from '@/modules/monetization/services/monetization-client';

export type OpeningSetting = {
  code: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
};

/** Opções que o Founder, o contabilista e os administradores abrem ou fecham. */
export const OPENING_SETTINGS: OpeningSetting[] = [
  {
    code: 'payments_open',
    label: 'Cobrança',
    description: 'Abre o pagamento que já existe. Fechado, ninguém cobra. Não cria um banco novo.',
    defaultEnabled: false,
  },
  {
    code: 'visits_open',
    label: 'Pedidos de visita',
    description: 'O cliente pode indicar o dia da visita.',
    defaultEnabled: true,
  },
  {
    code: 'reviews_open',
    label: 'Avaliações',
    description: 'Quem teve contrato concluído pode avaliar.',
    defaultEnabled: true,
  },
  {
    code: 'providers_open',
    label: 'Registo de prestadores',
    description: 'Uma empresa pode pedir para entrar. A aprovação continua obrigatória.',
    defaultEnabled: true,
  },
  {
    code: 'publications_open',
    label: 'Registo de imóveis',
    description: 'O parceiro pode registar imóvel, mesmo ainda indisponível.',
    defaultEnabled: true,
  },
];

export type OpeningRow = OpeningSetting & { enabled: boolean; stored: boolean };

function closedMessage(label: string): string {
  return `${label} está fechado nas definições. O Founder, o contabilista ou um administrador pode abrir.`;
}

export async function readOpeningSettings(): Promise<OpeningRow[]> {
  const listed = await listFeatureFlags();
  const rows = listed.ok ? listed.data : [];
  return OPENING_SETTINGS.map((item) => {
    const found = rows.find((row) => row.code === item.code);
    return {
      ...item,
      enabled: found ? found.enabled : item.defaultEnabled,
      stored: Boolean(found),
    };
  });
}

export async function openingAllows(
  code: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const item = OPENING_SETTINGS.find((row) => row.code === code);
  const listed = await listFeatureFlags();
  if (!listed.ok) {
    if (item && !item.defaultEnabled) return { ok: false, message: closedMessage(item.label) };
    return { ok: true };
  }
  const found = listed.data.find((row) => row.code === code);
  const enabled = found ? found.enabled : (item?.defaultEnabled ?? true);
  if (!enabled) return { ok: false, message: closedMessage(item?.label ?? code) };
  return { ok: true };
}

export async function setOpeningSetting(
  item: OpeningSetting,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { error } = await client.from('platform_feature_flags').upsert(
      {
        code: item.code,
        label: item.label,
        description: item.description,
        enabled,
      },
      { onConflict: 'code' },
    );
    if (!error) return { ok: true };
  } catch {
    /* tenta a função */
  }
  const rpc = await setFeatureFlag(item.code, enabled);
  if (rpc.ok) return rpc;
  return {
    ok: false,
    message:
      'Ainda não ficou gravado. O Founder com gestão financeira já pode abrir isto. O contabilista e o administrador passam a gravar quando a migração 0059 estiver na base.',
  };
}
