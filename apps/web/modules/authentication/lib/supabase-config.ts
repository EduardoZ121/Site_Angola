import { env } from '@/lib/env';

function looksLikePlaceholder(url: string | undefined, anon: string | undefined): boolean {
  if (!url || !anon) return true;
  if (url.includes('YOUR_PROJECT') || url.includes('example.supabase')) return true;
  if (anon === 'your-anon-key' || anon.length < 20) return true;
  return false;
}

/** True when public Supabase URL + anon key look real (UI may still render when false). */
export function isSupabaseConfigured(): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;
  if (looksLikePlaceholder(url, anon)) return false;
  return true;
}
