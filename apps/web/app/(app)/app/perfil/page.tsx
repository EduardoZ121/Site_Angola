import type { Metadata } from 'next';
import { ProfileIdentityClient } from '@/modules/identidade/components/ProfileIdentityClient';

export const metadata: Metadata = {
  title: 'Perfil e Identidade',
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return <ProfileIdentityClient />;
}
