import type { Metadata } from 'next';
import { ExploreListClient } from '@/modules/habitacao/components/ExploreListClient';

export const metadata: Metadata = {
  title: 'Explorar habitação',
  robots: { index: false, follow: false },
};

export default function HabitacaoExplorarPage() {
  return <ExploreListClient />;
}
