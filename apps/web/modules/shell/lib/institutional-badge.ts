export type InstitutionalBadgeInput = {
  isOwner?: boolean;
  isFounder?: boolean;
  isSystemDemo?: boolean;
  roles?: string[];
  role?: string;
};

export type InstitutionalBadge = {
  label: string;
  className: string;
};

/**
 * Visual identity chrome for institutional roles (topbar / directory).
 */
export function institutionalBadge(
  roleOrFlags: InstitutionalBadgeInput,
): InstitutionalBadge | null {
  const roles = [...(roleOrFlags.roles ?? []), ...(roleOrFlags.role ? [roleOrFlags.role] : [])].map(
    (r) => r.toLowerCase(),
  );

  if (roleOrFlags.isSystemDemo || roles.includes('system_demo')) {
    return {
      label: 'System Demo',
      className: 'bg-slate-200 text-slate-800 ring-1 ring-slate-400',
    };
  }

  if (roleOrFlags.isOwner) {
    return {
      label: '◆ Founder / Owner',
      className: 'bg-blue-600 text-white ring-1 ring-blue-800 shadow-sm',
    };
  }

  if (roleOrFlags.isFounder || roles.includes('founder')) {
    if (roles.includes('co_founder')) {
      return {
        label: 'Co-Founder',
        className: 'bg-cyan-500 text-white ring-1 ring-cyan-700',
      };
    }
    return {
      label: '◆ Founder',
      className: 'bg-blue-600 text-white ring-1 ring-blue-800 shadow-sm',
    };
  }

  if (roles.includes('co_founder')) {
    return {
      label: 'Co-Founder',
      className: 'bg-cyan-500 text-white ring-1 ring-cyan-700',
    };
  }

  if (roles.includes('super_administrator')) {
    return {
      label: 'Super Admin',
      className: 'bg-violet-600 text-white ring-1 ring-violet-800',
    };
  }

  if (roles.includes('administrator')) {
    return {
      label: 'Admin',
      className: 'bg-emerald-600 text-white ring-1 ring-emerald-800',
    };
  }

  if (roles.includes('supervisor')) {
    return {
      label: 'Supervisor',
      className: 'bg-orange-500 text-white ring-1 ring-orange-700',
    };
  }

  return null;
}
