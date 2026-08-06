import type { ContratosCopy } from './pt';

export const contratosCopyEs: ContratosCopy = {
  title: 'Contratos',
  subtitle:
    'Formalice la intención aprobada en un contrato, con partes, importe, términos y estados claros.',
  create: 'Preparar contrato',
  createTitle: 'Preparar nuevo contrato',
  createHint:
    'Elija un patrimonio activo, identifique al Cliente y registre el borrador antes del pago.',
  creating: 'Preparando…',
  created: 'Contrato preparado para su aceptación.',
  detailTitle: 'Detalle del contrato',
  demoNote:
    'Datos de demostración: contratos vinculados al inventario KTK-DEMO para mostrar el proceso en uso.',
  emptyTitle: 'Aún no hay contratos',
  empty:
    'Cuando Confianza y Administración validen las partes, prepare el primer contrato para pasar a Pagos.',
  emptyDemo:
    'Si la base de datos está vacía, ejecute la migración PRD-008 para cargar los contratos de demostración KTK-CTR.',
  loadError: 'Estamos teniendo dificultades para mostrar los contratos. Inténtelo de nuevo.',
  saveError: 'No pudimos preparar el contrato. Verifique los datos e inténtelo de nuevo.',
  transitionError: 'No pudimos actualizar el contrato. Inténtelo de nuevo.',
  forbidden:
    'El área de Contratos está disponible cuando su cuenta tiene el rol adecuado (Cliente, Socio, Agente o Administrador).',
  kycRequired:
    'Se requiere identidad verificada (KYC nivel 2+): complete el Perfil y la Confianza del Cliente y del Socio antes de formalizar contratos reales.',
  kycBanner:
    'Los contratos reales requieren Identidad Real (documento validado). Complete su Perfil si aún no lo ha hecho.',
  kycBannerCta: 'Abrir Perfil KYC',
  accept: 'Aceptar contrato',
  accepting: 'Aceptando…',
  accepted: 'Contrato activo. El siguiente paso es preparar el pago.',
  cancel: 'Cancelar contrato',
  cancelling: 'Cancelando…',
  cancelled: 'Contrato cancelado.',
  complete: 'Marcar como concluido',
  completing: 'Concluyendo…',
  completed: 'Contrato concluido.',
  openDetail: 'Abrir contrato',
  preparePayment: 'Preparar pago',
  paymentsSoon: 'Pagos en expansión — por ahora, haga seguimiento desde el panel.',
  fields: {
    code: 'Código',
    property: 'Patrimonio',
    propertyId: 'ID del patrimonio',
    clientId: 'ID del Cliente',
    agentId: 'ID del Agente (opcional)',
    interestId: 'ID del interés (opcional)',
    purpose: 'Finalidad',
    amount: 'Importe (AOA)',
    title: 'Título',
    titlePlaceholder: 'Ej.: Contrato de alquiler — Apartamento de 3 habitaciones en Kilamba',
    terms: 'Términos y notas',
    termsPlaceholder: 'Incluya las condiciones esenciales, los plazos y las responsabilidades.',
    status: 'Estado',
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
    parties: 'Partes',
    partner: 'Socio',
    client: 'Cliente',
    agent: 'Agente',
    payment: 'Pago',
  },
  purposes: {
    rent: 'Alquiler',
    sale: 'Venta',
  },
  statuses: {
    draft: 'Borrador',
    pending_acceptance: 'Pendiente de aceptación',
    active: 'Activo',
    completed: 'Concluido',
    cancelled: 'Cancelado',
  },
};
