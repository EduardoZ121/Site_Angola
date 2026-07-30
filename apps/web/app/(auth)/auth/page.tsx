import type { Metadata } from 'next';
import AuthPlaceholderClient from './AuthPlaceholderClient';

export const metadata: Metadata = {
  title: 'Autenticação',
  description: 'Acesso à plataforma Kuteka — em preparação.',
  robots: { index: false, follow: false },
};

export default function AuthPlaceholderPage() {
  return <AuthPlaceholderClient />;
}
