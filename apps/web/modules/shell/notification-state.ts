import type { NoticeStatus, ShellNotification } from './notifications';
import { noticeStatus } from './notifications';

const KEY = 'kuteka-notif-status';

function readMap(): Record<string, NoticeStatus> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, NoticeStatus>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function applyStoredStatus(items: readonly ShellNotification[]): ShellNotification[] {
  const map = readMap();
  return items.map((item) => {
    const stored = map[item.id];
    if (!stored) return { ...item, status: noticeStatus(item) };
    return { ...item, status: stored, unread: stored === 'unread' };
  });
}

export function rememberNoticeStatus(id: string, status: NoticeStatus) {
  if (typeof window === 'undefined') return;
  try {
    const map = readMap();
    map[id] = status;
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
}

export function isNoticeUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
