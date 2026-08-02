import type { Metadata } from 'next';
import { ContactClient } from '@/modules/shell/components/ContactClient';

export const metadata: Metadata = {
  title: 'Contacto',
  robots: { index: false, follow: false },
};

export default function ContactPage() {
  return <ContactClient />;
}
