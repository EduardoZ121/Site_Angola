import { createBrowserClient } from '@/lib/supabase/client';
import { visitRequestState } from '@/modules/habitacao/lib/visit-request';
import { listOperationalEscalations } from '@/modules/administracao/services/escalation-client';
import { getIdentity } from '@/modules/kocc/services/institutional-client';
import type { ShellNotification } from '../notifications';

function notice(
  item: Omit<ShellNotification, 'unread' | 'status'> & { action?: boolean },
): ShellNotification {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    href: item.href,
    audience: item.audience,
    unread: true,
    status: item.action ? 'action' : 'unread',
  };
}

/** Avisos reais, separados por quem deve agir. */
export async function fetchLiveNotices(): Promise<ShellNotification[]> {
  const items: ShellNotification[] = [];
  const identity = await getIdentity();
  let userId = identity.ok ? identity.data.userId : undefined;
  const roles = identity.ok ? (identity.data.roles ?? []) : [];
  if (!userId) {
    try {
      const client = createBrowserClient();
      const { data } = await client.auth.getUser();
      userId = data.user?.id;
    } catch {
      userId = undefined;
    }
  }

  try {
    const client = createBrowserClient();
    const { data } = await client
      .from('property_interests')
      .select('id, client_id, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    for (const row of data ?? []) {
      const notes = (row.notes as string | null) ?? '';
      const state = visitRequestState(notes);
      if (state !== 'requested' && state !== 'accepted') continue;
      const mine = userId != null && row.client_id === userId;
      const line = notes.split('\n')[0] ?? '';
      if (mine && state === 'requested') {
        items.push(
          notice({
            id: `live-visit-${row.id}`,
            audience: 'Cliente',
            title: 'O seu pedido de visita ainda espera resposta',
            body: line,
            href: '/app/habitacao?vista=visitas',
            action: true,
          }),
        );
      } else if (mine) {
        items.push(
          notice({
            id: `live-visit-${row.id}`,
            audience: 'Cliente',
            title: 'O agente aceitou o seu pedido',
            body: 'A hora combina-se por mensagem.',
            href: '/app/habitacao?vista=visitas',
          }),
        );
      } else if (state === 'requested') {
        items.push(
          notice({
            id: `live-visit-${row.id}`,
            audience: 'Agente',
            title: 'Há um pedido de visita para aceitar',
            body: line,
            href: '/app/agente#visitas',
            action: true,
          }),
        );
      }
    }
  } catch {
    /* sem leitura de interesses */
  }

  const escalations = await listOperationalEscalations(12);
  if (escalations.ok) {
    for (const row of escalations.data) {
      if (row.status !== 'open') continue;
      const mine = roles.includes(row.target_level);
      if (!mine && row.created_by !== userId) continue;
      items.push(
        notice({
          id: `live-esc-${row.id}`,
          audience: mine ? 'Cargo' : 'Quem abriu',
          title: mine ? 'O seu cargo pode aceitar ou recusar' : 'A sua escalação ainda está aberta',
          body: row.reason,
          href: '/app/admin#escalacoes',
          action: mine,
        }),
      );
    }
  }

  const order = ['Cargo', 'Agente', 'Cliente', 'Quem abriu'];
  items.sort((a, b) => order.indexOf(a.audience ?? '') - order.indexOf(b.audience ?? ''));
  return items.slice(0, 12);
}
