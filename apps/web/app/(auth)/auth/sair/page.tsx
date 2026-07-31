'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { getAuthCopy } from '@/modules/authentication/content';
import { isSupabaseConfigured } from '@/modules/authentication/lib/supabase-config';
import { signOut } from '@/modules/authentication/services/auth-client';

/**
 * F4 — logout page (static-export compatible; replaces Route Handler).
 */
export default function LogoutPage() {
  const copy = getAuthCopy();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isSupabaseConfigured()) {
          await signOut();
        }
        if (!cancelled) {
          setDone(true);
          router.replace('/?logout=1');
        }
      } catch {
        if (!cancelled) {
          setError(copy.common.networkError);
          setDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy.common.networkError, router]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center gap-4 px-2 py-8">
      <Heading level={1}>{copy.logout.title}</Heading>
      <Text>{done ? copy.logout.done : copy.logout.pending}</Text>
      {error ? <Text className="text-red-700">{error}</Text> : null}
      <Link href="/" className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}>
        Voltar à Landing
      </Link>
    </main>
  );
}
