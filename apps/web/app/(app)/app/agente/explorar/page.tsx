import type { Metadata } from 'next';
import { AgentExploreClient } from '@/modules/agente/components/AgentExploreClient';

export const metadata: Metadata = {
  title: 'Explorar — Agente',
  robots: { index: false, follow: false },
};

export default function AgenteExplorarPage() {
  return <AgentExploreClient />;
}
