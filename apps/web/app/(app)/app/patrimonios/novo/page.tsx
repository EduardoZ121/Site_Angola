import type { Metadata } from 'next';
import { ActivatePropertyForm } from '@/modules/patrimonios/components/ActivatePropertyForm';

export const metadata: Metadata = {
  title: 'Ativar Património',
  robots: { index: false, follow: false },
};

export default function NovoPatrimonioPage() {
  return <ActivatePropertyForm />;
}
