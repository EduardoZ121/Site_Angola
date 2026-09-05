import type { Metadata } from 'next';
import { ContactClient } from '@/modules/shell/components/ContactClient';

export const metadata: Metadata = {
  title: 'Contacto',
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return <ContactClient />;
}
