import type { Metadata } from 'next';
import { HelpCenterClient } from '@/modules/shell/components/HelpCenterClient';

export const metadata: Metadata = {
  title: 'Centro de Ajuda',
  robots: { index: false, follow: false },
};

export default function AjudaPage() {
  return <HelpCenterClient />;
}
