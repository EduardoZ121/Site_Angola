'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  EXPERIENCE_STORAGE_KEY,
  availableExperiences,
  permissionsForExperience,
  resolveExperience,
  type ExperienceMode,
} from '../role-experience';

type RoleExperienceContextValue = {
  mode: ExperienceMode;
  available: ExperienceMode[];
  effectivePermissions: string[];
  setMode: (mode: ExperienceMode) => void;
  ready: boolean;
};

const RoleExperienceContext = createContext<RoleExperienceContextValue>({
  mode: 'client',
  available: ['client'],
  effectivePermissions: [],
  setMode: () => undefined,
  ready: false,
});

export function useRoleExperience() {
  return useContext(RoleExperienceContext);
}

type RoleExperienceProviderProps = {
  roles: readonly string[];
  permissions: readonly string[];
  children: ReactNode;
};

export function RoleExperienceProvider({
  roles,
  permissions,
  children,
}: RoleExperienceProviderProps) {
  const available = useMemo(() => availableExperiences(roles), [roles]);
  const [mode, setModeState] = useState<ExperienceMode>(() => resolveExperience(roles, null));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(EXPERIENCE_STORAGE_KEY);
    } catch {
      stored = null;
    }
    setModeState(resolveExperience(roles, stored));
    setReady(true);
  }, [roles]);

  const setMode = useCallback(
    (next: ExperienceMode) => {
      if (!available.includes(next)) return;
      setModeState(next);
      try {
        window.localStorage.setItem(EXPERIENCE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    },
    [available],
  );

  const effectivePermissions = useMemo(
    () => permissionsForExperience(mode, permissions),
    [mode, permissions],
  );

  const value = useMemo(
    () => ({
      mode,
      available,
      effectivePermissions,
      setMode,
      ready,
    }),
    [mode, available, effectivePermissions, setMode, ready],
  );

  return <RoleExperienceContext.Provider value={value}>{children}</RoleExperienceContext.Provider>;
}
