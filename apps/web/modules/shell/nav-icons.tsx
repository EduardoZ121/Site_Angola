import type { ReactElement } from 'react';
import type { ShellNavItem } from './nav';

type IconProps = { className?: string };

function IconHome({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M3.5 9.2 10 3.5l6.5 5.7V16a1 1 0 0 1-1 1h-3.5v-4.2H8V17H4.5a1 1 0 0 1-1-1V9.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBuilding({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M4 17V5.5A1.5 1.5 0 0 1 5.5 4H11v13M11 8h4.5A1.5 1.5 0 0 1 17 9.5V17M7 7.5h1.5M7 10.5h1.5M7 13.5h1.5M13 11h1.5M13 14h1.5M3.5 17h13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconKey({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="7" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9.4 10.2 16 16.5M13.2 13.4l1.8-.2.6 1.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAgent({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="6.5" r="2.8" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4.5 16.5c.7-3 2.7-4.5 5.5-4.5s4.8 1.5 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M15.5 8.5h2M16.5 7.5v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M10 2.8 16 5v4.8c0 3.6-2.4 5.8-6 7.4-3.6-1.6-6-3.8-6-7.4V5l6-2.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAdmin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M4 6.5h12M4 10h12M4 13.5h8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="14.5" cy="13.5" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

const ICONS: Record<ShellNavItem['labelKey'], (props: IconProps) => ReactElement> = {
  home: IconHome,
  patrimonios: IconBuilding,
  habitacao: IconKey,
  agente: IconAgent,
  confianca: IconShield,
  admin: IconAdmin,
};

export function NavIcon({
  labelKey,
  className = 'size-4 shrink-0',
}: {
  labelKey: ShellNavItem['labelKey'];
  className?: string;
}) {
  const Icon = ICONS[labelKey];
  return <Icon className={className} />;
}
