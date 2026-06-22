export const propertyTypes = [
  { value: 'casa', label: 'Casa / Vivenda', icon: '🏠' },
  { value: 'apartamento', label: 'Apartamento', icon: '🏢' },
  { value: 'terreno', label: 'Terreno', icon: '📐' },
  { value: 'loja', label: 'Loja / Comércio', icon: '🏪' },
  { value: 'carro', label: 'Carro / Veículo', icon: '🚗' },
]

export const propertyStatuses = [
  'Ocupado por mim',
  'Arrendado a inquilino',
  'Vazio / disponível',
  'Em obras ou renovação',
  'Ainda em construção',
]

export const sellPlans = [
  'Quero vender já',
  'Nos próximos 3 meses',
  'Entre 3 e 6 meses',
  'Entre 6 e 12 meses',
  'Só quero saber o valor estimado',
  'Quero arrendar',
]

export const defaultAddPropertyDraft = {
  propertyType: 'casa',
  address: '',
  province: 'Luanda',
  municipality: '',
  neighborhood: '',
  propertyStatus: '',
  sellPlan: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  priceExpectation: '',
  acceptContact: true,
  acceptTerms: false,
}

export const ADD_PROPERTY_STORAGE_KEY = 'kuteka.addProperty.draft'
