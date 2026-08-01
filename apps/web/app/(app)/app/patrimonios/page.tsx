import type { Metadata } from 'next';
import { PropertyListClient } from '@/modules/patrimonios/components/PropertyListClient';

export const metadata: Metadata = {
  title: 'Patrimónios',
  robots: { index: false, follow: false },
};

export default function PatrimoniosPage() {
  return <PropertyListClient />;
}
