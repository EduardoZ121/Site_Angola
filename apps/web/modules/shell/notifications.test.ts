import { describe, expect, it } from 'vitest';
import { notificationsForMode, unreadCount } from './notifications';

describe('role notifications', () => {
  it('returns client notifications with unread count', () => {
    const items = notificationsForMode('client', 'pt');
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(unreadCount(items)).toBe(items.length);
    expect(items.some((i) => i.title.includes('imóveis'))).toBe(true);
  });

  it('returns partner-focused notifications', () => {
    const items = notificationsForMode('patrimonial_partner', 'pt');
    expect(items.some((i) => i.href.includes('patrimonios') || i.href.includes('confianca'))).toBe(
      true,
    );
  });
});
