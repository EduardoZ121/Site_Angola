import type { Metadata } from 'next';
import { SmartMoveClient } from '@/modules/monetization/components/SmartMoveClient';

export const metadata: Metadata = {
  title: 'Mudança Inteligente',
  robots: { index: false, follow: false },
};

export default function MudancaPage() {
  return <SmartMoveClient />;
}
