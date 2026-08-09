'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import type { ShellNotification } from '../notifications';

type DbNotification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

/** Prefer DB notifications when migration 0036 is applied; empty on failure. */
export async function fetchMyNotifications(limit = 20): Promise<ShellNotification[]> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('list_my_notifications', { p_limit: limit });
    if (error || !data) return [];
    return (data as DbNotification[]).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      href: row.href || '/app',
      unread: !row.read_at,
    }));
  } catch {
    return [];
  }
}

export async function markMyNotificationsRead(ids?: string[]): Promise<void> {
  try {
    const client = createBrowserClient();
    await client.rpc('mark_notifications_read', { p_ids: ids ?? null });
  } catch {
    /* non-blocking */
  }
}
