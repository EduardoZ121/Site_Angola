import type { Metadata } from 'next';
import { ApprovalDocsClient } from '@/modules/finance/components/ApprovalDocsClient';
import { readPublicDoc } from '@/modules/institutional/lib/read-public-doc';

export const metadata: Metadata = {
  title: 'Documentos para aprovação',
  robots: { index: false, follow: false },
};

export default function ApprovalDocsPage() {
  return (
    <ApprovalDocsClient
      accountant={readPublicDoc('PACOTE_CONTABILISTA_APROVACAO.md')}
      lawyer={readPublicDoc('PACOTE_JURISTA_APROVACAO.md')}
    />
  );
}
