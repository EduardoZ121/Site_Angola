'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { experienceLabel, modeBadgeLabel } from '@/modules/i18n/experience-labels';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { roleLabelPt, type AppSessionData } from '@/modules/authentication/components/app-session';
import { getAuthCopy } from '@/modules/authentication/content';
import { createBrowserClient } from '@/lib/supabase/client';
import { KYC_LEVEL_LABELS, type KycLevel } from '@/modules/identidade/lib/kyc';
import { getShellCopy } from '../content';
import type { ExperienceMode } from '../role-experience';
import { useInstitutionalIdentity } from '../hooks/useInstitutionalIdentity';
import { institutionalBadge } from '../lib/institutional-badge';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useRoleExperience } from './RoleExperienceProvider';

type UserMenuProps = {
  session: AppSessionData | null;
  sessionStatus: 'loading' | 'ready' | 'error';
  roleLabels: Record<string, string>;
};

type MenuItem = {
  href: string;
  label: string;
  hint: string;
  icon: string;
};

function MenuIcon({ name }: { name: string }) {
  const common = 'size-[1.15rem] shrink-0 stroke-[1.85]';
  switch (name) {
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" />
          <path
            d="M5 19.5c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'roles':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" />
          <path d="M16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" />
          <path
            d="M3.5 19c.8-2.8 2.6-4 4.5-4s3.7 1.2 4.5 4"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M14 15.5c1.2-.8 2.5-1 3.8-1 1.7 0 3.2.8 4.2 2.5"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'contracts':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
            stroke="currentColor"
          />
          <path d="M14 3.5V8h4M9 12h6M9 16h4" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case 'docs':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path d="M8 4h6l4 4v12H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" />
          <path d="M10 13h4M10 16h3" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M12 4a5 5 0 0 0-5 5v2.2c0 .9-.4 1.7-1 2.3L5 15h14l-1-1.5c-.6-.6-1-1.4-1-2.3V9a5 5 0 0 0-5-5Z"
            stroke="currentColor"
          />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path d="M4 7.5 12 13l8-5.5" stroke="currentColor" strokeLinecap="round" />
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" />
          <path
            d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'privacy':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M12 3.5 19 6v5c0 4.2-2.8 7-7 9-4.2-2-7-4.8-7-9V6l7-2.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'help':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
          <path
            d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 2"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'contact':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M6.5 5.5h3l1.5 3.5-2 1.2a10 10 0 0 0 4.8 4.8l1.2-2 3.5 1.5v3A1.5 1.5 0 0 1 16.5 19 12.5 12.5 0 0 1 5 7.5a1.5 1.5 0 0 1 1.5-2Z"
            stroke="currentColor"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M13 12h7M17 8l4 4-4 4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function ItemList({ items, onNavigate }: { items: MenuItem[]; onNavigate: () => void }) {
  return (
    <ul className="py-1">
      {items.map((item) => (
        <li key={item.href + item.label}>
          <Link
            role="menuitem"
            href={item.href}
            className="kuteka-account-item"
            onClick={onNavigate}
          >
            <span className="kuteka-account-item__icon">
              <MenuIcon name={item.icon} />
            </span>
            <span className="min-w-0">
              <span className="kuteka-account-item__label">{item.label}</span>
              <span className="kuteka-account-item__hint">{item.hint}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Premium account menu — AA contrast, internal scroll, role + language.
 */
export function UserMenu({ session, sessionStatus, roleLabels }: UserMenuProps) {
  const { locale } = useLocale();
  const auth = getAuthCopy(locale);
  const shell = getShellCopy(locale);
  const router = useRouter();
  const { mode, available, setMode, effectivePermissions } = useRoleExperience();
  const { identity } = useInstitutionalIdentity(sessionStatus === 'ready' && !!session);
  const identityBadge =
    identity && (identity.isFounder || identity.isOwner || identity.isSystemDemo)
      ? institutionalBadge({
          isOwner: identity.isOwner,
          isFounder: identity.isFounder,
          isSystemDemo: identity.isSystemDemo,
          roles: identity.roles,
        })
      : null;
  const [open, setOpen] = useState(false);
  const [trustStrip, setTrustStrip] = useState<{
    kycLevel: number;
    uts: number;
    ick: number | null;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const headerName = session?.displayName || session?.email || auth.app.userFallback;
  const roleBadges = session?.roles ?? [];
  const accountRoles =
    roleBadges.length > 0
      ? roleBadges.map((code) => roleLabelPt(code, roleLabels)).join(' · ')
      : sessionStatus === 'ready'
        ? auth.app.noRoles
        : '…';
  const modeLabel = modeBadgeLabel(mode, locale);
  const initials = (session?.displayName || session?.email || 'K')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  useEffect(() => {
    if (sessionStatus !== 'ready' || !session) {
      setTrustStrip(null);
      return;
    }
    let cancelled = false;
    async function loadTrust() {
      try {
        const client = createBrowserClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (!user) return;
        const { data } = await client
          .from('profiles')
          .select('kyc_level, trust_index, ick_score')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled || !data) return;
        setTrustStrip({
          kycLevel: Number(data.kyc_level ?? 0),
          uts: Number(data.trust_index ?? 0),
          ick: data.ick_score != null ? Number(data.ick_score) : null,
        });
      } catch (err) {
        console.error('[UserMenu] trust strip', err);
        if (!cancelled) setTrustStrip(null);
      }
    }
    void loadTrust();
    return () => {
      cancelled = true;
    };
  }, [session, sessionStatus]);

  const canPartner = effectivePermissions.includes('properties.manage');
  const canContracts = effectivePermissions.includes('contracts.manage');
  const canTrust = effectivePermissions.includes('trust.manage');

  const primaryItems: MenuItem[] = [
    {
      href: '/app/perfil',
      label: shell.userMenu.profile,
      hint: shell.userMenu.profileHint,
      icon: 'profile',
    },
    {
      href: '/app/centro-confianca',
      label: shell.items.centroConfianca,
      hint: shell.userMenu.centroConfiancaHint,
      icon: 'docs',
    },
    {
      href: '/app/centro-seguranca',
      label: shell.items.centroSeguranca,
      hint: shell.userMenu.centroSegurancaHint,
      icon: 'docs',
    },
    {
      href: '/auth/onboarding/papeis',
      label: shell.userMenu.roles,
      hint: shell.userMenu.rolesHint,
      icon: 'roles',
    },
    {
      href: '/app/fundador',
      label: 'Founder / Owner',
      hint: 'Bootstrap, user_id e Gestão Institucional',
      icon: 'roles',
    },
    ...(canPartner
      ? [
          {
            href: '/app/patrimonios',
            label: shell.userMenu.patrimonios,
            hint: shell.userMenu.patrimoniosHint,
            icon: 'home',
          } satisfies MenuItem,
        ]
      : []),
    ...(canContracts
      ? [
          {
            href: '/app/contratos',
            label: shell.userMenu.contracts,
            hint: shell.userMenu.contractsHint,
            icon: 'contracts',
          } satisfies MenuItem,
        ]
      : []),
    ...(canTrust
      ? [
          {
            href: '/app/confianca',
            label: shell.userMenu.documents,
            hint: shell.userMenu.documentsHint,
            icon: 'docs',
          } satisfies MenuItem,
        ]
      : []),
    {
      href: '/app/definicoes#notificacoes',
      label: shell.userMenu.notifications,
      hint: shell.userMenu.notificationsHint,
      icon: 'bell',
    },
    {
      href: '/app/mensagens',
      label: shell.userMenu.messages,
      hint: shell.userMenu.messagesHint,
      icon: 'messages',
    },
  ];

  const preferenceItems: MenuItem[] = [
    {
      href: '/app/definicoes',
      label: shell.userMenu.settings,
      hint: shell.userMenu.settingsHint,
      icon: 'settings',
    },
    {
      href: '/privacidade',
      label: shell.userMenu.privacy,
      hint: shell.userMenu.privacyHint,
      icon: 'privacy',
    },
  ];

  const supportItems: MenuItem[] = [
    {
      href: '/app/ajuda',
      label: shell.userMenu.help,
      hint: shell.userMenu.helpHint,
      icon: 'help',
    },
    {
      href: '/contacto',
      label: shell.userMenu.contact,
      hint: shell.userMenu.contactHint,
      icon: 'contact',
    },
  ];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'flex max-w-[16rem] items-center gap-2.5 px-2 text-slate-100 hover:bg-white/10 sm:max-w-xs',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f0a91f] text-xs font-bold text-[#08263f] ring-2 ring-white/30"
        >
          {initials || 'K'}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-white">{headerName}</span>
          <span className="mt-0.5 block truncate text-xs font-medium text-[#fde68a]">
            {modeLabel}
          </span>
          {identityBadge ? (
            <span
              className={`mt-1 inline-flex max-w-full truncate rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${identityBadge.className}`}
            >
              {identityBadge.label}
            </span>
          ) : null}
        </span>
        <span aria-hidden className="hidden text-xs text-slate-200 sm:inline">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={shell.userMenuAria}
          className="kuteka-account-panel kuteka-account-panel--menu"
        >
          <div className="kuteka-account-panel__head">
            <Link
              href="/app/perfil"
              className="kuteka-account-avatar"
              onClick={() => setOpen(false)}
              title={shell.changePhoto}
            >
              <span aria-hidden>{initials || 'K'}</span>
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{headerName}</p>
              <p className="kuteka-mode-chip mt-1">{modeLabel}</p>
              {identityBadge ? (
                <span
                  className={`mt-1 inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${identityBadge.className}`}
                >
                  {identityBadge.label}
                </span>
              ) : null}
              <p className="mt-1 truncate text-xs font-medium text-stone-700">
                {shell.accountLabel}: {accountRoles}
              </p>
              {trustStrip ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200">
                    KYC {trustStrip.kycLevel}
                  </span>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900 ring-1 ring-sky-200">
                    UTS {Math.round(trustStrip.uts)}
                  </span>
                  {trustStrip.ick != null ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-200">
                      ICK {Math.round(trustStrip.ick)}
                    </span>
                  ) : null}
                  <span
                    className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700 ring-1 ring-stone-200"
                    title={
                      KYC_LEVEL_LABELS[Math.min(4, Math.max(0, trustStrip.kycLevel)) as KycLevel]
                    }
                  >
                    {roleBadges.length}{' '}
                    {roleBadges.length === 1
                      ? shell.userMenu.roleCountSingular
                      : shell.userMenu.roleCountPlural}
                  </span>
                </div>
              ) : null}
              <Link
                href="/app/centro-confianca"
                className="mt-1 inline-block text-xs font-semibold text-[#92400e] underline-offset-2 hover:underline"
                onClick={() => setOpen(false)}
              >
                {shell.items.centroConfianca}
              </Link>
              <Link
                href="/app/perfil"
                className="mt-1 ml-2 inline-block text-xs font-semibold text-[#92400e] underline-offset-2 hover:underline"
                onClick={() => setOpen(false)}
              >
                {shell.changePhoto}
              </Link>
            </div>
          </div>

          <div className="kuteka-account-panel__scroll">
            {available.length > 0 ? (
              <div className="kuteka-account-section">
                <p className="kuteka-account-section__title">{shell.switchRole}</p>
                <p className="kuteka-account-section__hint">{shell.switchRoleHint}</p>
                <ul className="mt-2 flex flex-col gap-1" role="group" aria-label={shell.switchRole}>
                  {available.map((m) => (
                    <li key={m}>
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={m === mode}
                        className={cn(
                          'kuteka-account-role',
                          m === mode && 'kuteka-account-role--active',
                        )}
                        onClick={() => {
                          setMode(m as ExperienceMode);
                          setOpen(false);
                          router.push('/app');
                        }}
                      >
                        <span>{experienceLabel(m, locale)}</span>
                        {m === mode ? <span aria-hidden>✓</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="kuteka-account-section">
              <ItemList items={primaryItems} onNavigate={() => setOpen(false)} />
            </div>

            <div className="kuteka-account-section">
              <LanguageSwitcher onSelected={() => setOpen(false)} />
            </div>

            <div className="kuteka-account-section">
              <ItemList items={preferenceItems} onNavigate={() => setOpen(false)} />
            </div>

            <div className="kuteka-account-section">
              <ItemList items={supportItems} onNavigate={() => setOpen(false)} />
            </div>

            <div className="kuteka-account-section kuteka-account-section--last">
              <Link
                role="menuitem"
                href="/auth/sair"
                className="kuteka-account-logout"
                onClick={() => setOpen(false)}
              >
                <span className="text-red-700">
                  <MenuIcon name="logout" />
                </span>
                {shell.userMenu.logout}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
