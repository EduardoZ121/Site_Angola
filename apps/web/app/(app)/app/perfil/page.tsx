import type { Metadata } from 'next';
import { ProfileIdentityClient } from '@/modules/identidade/components/ProfileIdentityClient';

export const metadata: Metadata = {
  title: 'KIS — Identidade Kuteka',
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return <ProfileIdentityClient />;
}
