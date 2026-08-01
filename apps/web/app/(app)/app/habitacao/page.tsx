import type { Metadata } from 'next';
import { PreferencesForm } from '@/modules/habitacao/components/PreferencesForm';

export const metadata: Metadata = {
  title: 'Habitação',
  robots: { index: false, follow: false },
};

export default function HabitacaoPage() {
  return <PreferencesForm />;
}
