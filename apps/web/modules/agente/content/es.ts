import type { AgenteCopy } from './pt';

export const agenteCopyEs: AgenteCopy = {
  title: 'Agente Certificado',
  subtitle:
    'Represente a Kuteka sobre el terreno: defina su cobertura, explore el inventario activo y active seguimientos.',
  explore: 'Explorar inventario',
  preferencesTitle: 'Preferencias de cobertura',
  preferencesHint: 'Indique la zona y la finalidad en la que desea actuar.',
  savePreferences: 'Guardar preferencias',
  saving: 'Guardando…',
  saved: 'Preferencias guardadas.',
  needAgent:
    'Las operaciones reales requieren el rol de Agente Certificado (asignado por la Administración). Abajo encontrará una vista previa Beta del flujo de trabajo.',
  demoTitle: 'Vista previa Beta del flujo de trabajo',
  demoHint:
    'Datos ilustrativos con el inventario Beta — para probar el recorrido sin permiso de agente.',
  demoVisits: 'Visitas',
  demoAgenda: 'Agenda',
  demoPipeline: 'Flujo de trabajo',
  requestAgent: 'Solicitar activación (contacto)',
  requestAgentHint:
    'El rol de Agente Certificado lo asigna la Administración. Contacte a Kuteka o continúe explorando la vista previa Beta.',
  loadError: 'Estamos teniendo dificultades para mostrar el área de Agente. Inténtelo de nuevo.',
  saveError: 'No pudimos guardar. Inténtelo de nuevo.',
  forbidden: 'No tiene permiso de Agente Certificado.',
  exploreTitle: 'Inventario activo',
  exploreSubtitle: 'Patrimonios disponibles para un seguimiento responsable sobre el terreno.',
  emptyExploreTitle: 'Ningún patrimonio en esta cobertura',
  emptyExplore:
    'No hay patrimonios activos con los filtros actuales. Ajuste la cobertura o explore de nuevo más tarde.',
  emptyAssignmentsTitle: 'Sin seguimientos activos',
  emptyAssignments:
    'Cuando active un seguimiento, quedará registrado aquí para hacer seguimiento de su trabajo de campo.',
  emptyAssignmentsCta: 'Explorar inventario',
  assignmentsTitle: 'Seguimientos activos',
  activate: 'Activar seguimiento',
  activating: 'Activando…',
  activated: 'Seguimiento activado.',
  alreadyAssigned: 'Ya tiene un seguimiento activo para este patrimonio.',
  backToHub: 'Volver al área de Agente',
  backToExplore: 'Volver al inventario',
  detailTitle: 'Patrimonio para seguimiento',
  openDetail: 'Abrir ficha',
  mvpNote:
    'Concéntrese en la cobertura y los seguimientos. Las visitas, propuestas y la Academia se introducirán en fases posteriores.',
  viewHousingInventory: 'Ver inventario',
  activateAgentAdmin: 'Activar agente (Admin)',
  nextSteps: {
    title: 'Continuar el flujo Kuteka',
    viewActiveProperties: 'Ver patrimonios activos',
    verifyAccount: 'Verificar cuenta',
    administration: 'Administración',
    contactKuteka: 'Contactar a Kuteka',
  },
  fields: {
    purpose: 'Finalidad',
    province: 'Provincia',
    city: 'Ciudad',
    type: 'Tipo',
    address: 'Dirección',
    code: 'Código',
    notes: 'Notas de campo (opcional)',
    any: 'Cualquiera',
    status: 'Estado',
  },
  types: {
    apartment: 'Apartamento',
    house: 'Casa',
    land: 'Terreno',
    commercial: 'Comercial',
  },
  purposes: {
    rent: 'Alquiler',
    sale: 'Venta',
    both: 'Venta y alquiler',
  },
  statuses: {
    active: 'Activo',
    released: 'Liberado',
  },
};
