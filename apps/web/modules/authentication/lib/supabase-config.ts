import { env } from '@/lib/env';

/** True when public Supabase URL + anon key are present (UI may still render when false). */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
