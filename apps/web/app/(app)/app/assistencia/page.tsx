import type { Metadata } from 'next';
import { AssistenciaClient } from '@/modules/monetization/components/AssistenciaClient';

export const metadata: Metadata = {
  title: 'Assistência 24h',
  robots: { index: false, follow: false },
};

export default function AssistenciaPage() {
  return <AssistenciaClient />;
}
