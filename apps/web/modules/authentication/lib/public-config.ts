/**
 * Public runtime config — prefers `window.__KUTEKA_CONFIG__` (static hosts),
 * then build-time `NEXT_PUBLIC_*` env.
 */

export type KutekaPublicConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

declare global {
  interface Window {
    __KUTEKA_CONFIG__?: KutekaPublicConfig;
  }
}

function looksLikePlaceholder(url: string | undefined, anon: string | undefined): boolean {
  if (!url || !anon) return true;
  if (url.includes('YOUR_PROJECT') || url.includes('example.supabase')) return true;
  if (anon === 'your-anon-key' || anon.length < 20) return true;
  return false;
}

export function getPublicSupabaseConfig(): { url?: string; anon?: string } {
  if (typeof window !== 'undefined') {
    const runtime = window.__KUTEKA_CONFIG__;
    if (runtime?.supabaseUrl || runtime?.supabaseAnonKey) {
      return { url: runtime.supabaseUrl, anon: runtime.supabaseAnonKey };
    }
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function isPublicSupabaseConfigured(): boolean {
  const { url, anon } = getPublicSupabaseConfig();
  return !looksLikePlaceholder(url, anon);
}

export function requirePublicSupabaseEnv(): { url: string; anonKey: string } {
  const { url, anon } = getPublicSupabaseConfig();
  if (looksLikePlaceholder(url, anon) || !url || !anon) {
    throw new Error(
      'Supabase public env missing. Set NEXT_PUBLIC_SUPABASE_* or window.__KUTEKA_CONFIG__.',
    );
  }
  return { url, anonKey: anon };
}
