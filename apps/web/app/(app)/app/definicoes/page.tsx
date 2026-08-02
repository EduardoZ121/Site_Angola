import type { Metadata } from 'next';
import { SettingsClient } from '@/modules/shell/components/SettingsClient';

export const metadata: Metadata = {
  title: 'Definições',
  robots: { index: false, follow: false },
};

export default function DefinicoesPage() {
  return <SettingsClient />;
}
