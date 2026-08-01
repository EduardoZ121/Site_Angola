import type { Metadata } from 'next';
import { AgentHubClient } from '@/modules/agente/components/AgentHubClient';

export const metadata: Metadata = {
  title: 'Agente',
  robots: { index: false, follow: false },
};

export default function AgentePage() {
  return <AgentHubClient />;
}
