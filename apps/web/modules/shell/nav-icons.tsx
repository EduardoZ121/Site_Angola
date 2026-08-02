import type { ReactElement } from 'react';
import type { ShellNavLabelKey } from './nav';

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

function IconContract({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M5.5 3.5h7L15.5 6.5v10a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 3.8V7h3M7 9.5h6M7 12.2h6M7 14.9h3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 13.5 16.5 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconHeart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M10 16.5s-6-3.6-6-7.2A3.3 3.3 0 0 1 10 6.8a3.3 3.3 0 0 1 6 2.5c0 3.6-6 7.2-6 7.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCalendar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <rect
        x="3.5"
        y="4.5"
        width="13"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M3.5 8h13M7 3v3M13 3v3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPlus({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M10 4.5v11M4.5 10h11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M4 15.5V9M8.5 15.5V5M13 15.5v-4M17 15.5V7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4.5 16c1-3 2.8-4.5 5.5-4.5s4.5 1.5 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconOffer({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M3.5 10.5 10 4l6.5 6.5V16a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-5.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

const ICONS: Record<ShellNavLabelKey, (props: IconProps) => ReactElement> = {
  home: IconHome,
  explorar: IconSearch,
  residencia: IconKey,
  favoritos: IconHeart,
  visitas: IconCalendar,
  futuro: IconCalendar,
  propostas: IconOffer,
  patrimonios: IconBuilding,
  ativar: IconPlus,
  habitacao: IconKey,
  agente: IconAgent,
  confianca: IconShield,
  contratos: IconContract,
  relatorios: IconChart,
  conta: IconUser,
  admin: IconAdmin,
};

export function NavIcon({
  labelKey,
  className = 'size-4 shrink-0',
}: {
  labelKey: ShellNavLabelKey;
  className?: string;
}) {
  const Icon = ICONS[labelKey] ?? IconHome;
  return <Icon className={className} />;
}
