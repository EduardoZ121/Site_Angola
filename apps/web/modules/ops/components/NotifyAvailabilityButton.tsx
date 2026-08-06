'use client';

import { useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getOpsCopy } from '../content';

export function NotifyAvailabilityButton({ propertyId }: { propertyId: string }) {
  const { locale } = useLocale();
  const copy = getOpsCopy(locale).notify;
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [busy, setBusy] = useState(false);

  async function requestNotify() {
    setBusy(true);
    setStatus('idle');
    try {
      const client = createBrowserClient();
      const { error } = await client.rpc('request_availability_notify', {
        p_property_id: propertyId,
      });
      if (error) throw error;
      setStatus('ok');
    } catch {
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy || status === 'ok'}
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
        onClick={() => void requestNotify()}
      >
        {status === 'ok' ? copy.activatedLabel : copy.activateLabel}
      </button>
      {status === 'error' ? <p className="kuteka-detail-meta">{copy.error}</p> : null}
    </div>
  );
}
