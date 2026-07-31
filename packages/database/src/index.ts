import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type KutekaSupabaseClient = SupabaseClient;

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

/**
 * Browser client for SPA / static export.
 * Uses localStorage (not cookie chunking from @supabase/ssr) so sessions survive
 * client-side navigations on Render / GitHub Pages without a Next middleware.
 */
export function createBrowserSupabaseClient(env: SupabasePublicEnv): KutekaSupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'kuteka-auth',
      flowType: 'pkce',
    },
  });
}

/**
 * Cookie adapter kept generic so apps/web can pass Next.js cookies() API
 * without coupling this package tightly to a specific Next version.
 */
export interface CookieAdapter {
  getAll: () => { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
  setAll: (
    cookies: { name: string; value: string; options?: Record<string, unknown> }[],
  ) => void | Promise<void>;
}

export function createServerSupabaseClient(
  env: SupabasePublicEnv,
  cookies: CookieAdapter,
): KutekaSupabaseClient {
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) =>
        cookies.setAll(toSet),
    },
  });
}

/** Service-role client — server only. Never import in Client Components. */
export function createServiceRoleClient(env: {
  url: string;
  serviceRoleKey: string;
}): KutekaSupabaseClient {
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export { createBrowserClient, createServerClient, createClient };
export { fetchAuthorizationContext, writeAuditLog, type WriteAuditLogInput } from './authorization';
