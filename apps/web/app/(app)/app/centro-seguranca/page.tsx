import type { Metadata } from 'next';
import { SecurityCenterClient } from '@/modules/seguranca/components/SecurityCenterClient';

export const metadata: Metadata = {
  title: 'Centro de Segurança Kuteka',
  robots: { index: false, follow: false },
};

export default function CentroSegurancaPage() {
  return <SecurityCenterClient />;
}
