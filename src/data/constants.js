export const ADMIN_EMAIL = 'amarilinhaa@gmail.com'
export const AGENT_EMAIL = 'amarilinhaz@gmail.com'

export const STORAGE_KEYS = {
  profile: 'kuteka.market.profile',
  listings: 'kuteka.market.listings',
  favorites: 'kuteka.market.favorites',
  history: 'kuteka.market.history',
  chats: 'kuteka.market.chats',
  notifications: 'kuteka.market.notifications',
  siteUsers: 'kuteka.market.siteUsers',
  accounts: 'kuteka.market.accounts',
  buyerPrefs: 'kuteka.market.buyerPrefs',
  passwordResetTokens: 'kuteka.market.passwordResetTokens',
  approvedAgents: 'kuteka.market.approvedAgents',
  agentApplications: 'kuteka.market.agentApplications',
}

export const userRoles = {
  owner: 'proprietario',
  buyer: 'comprador',
}

export const accountTypes = [
  'Proprietário Particular',
  'Agente Imobiliário',
  'Empresa Imobiliária',
]

export const provinces = {
  Luanda: ['Belas', 'Cazenga', 'Kilamba Kiaxi', 'Talatona', 'Viana'],
  Benguela: ['Benguela', 'Lobito', 'Catumbela'],
  Huíla: ['Lubango', 'Chibia', 'Humpata'],
  Huambo: ['Huambo', 'Caála', 'Bailundo'],
}

export const bairros = {
  Belas: ['Talatona', 'Benfica', 'Morro Bento'],
  Cazenga: ['Cazenga', '11 de Novembro', 'Hoji-ya-Henda'],
  'Kilamba Kiaxi': ['Golfe', 'Palanca', 'Nova Vida'],
  Talatona: ['Cidade Financeira', 'Camama', 'Lar do Patriota'],
  Viana: ['Zango', 'Estalagem', 'Vila Flor'],
  Benguela: ['Praia Morena', 'Compão', 'Lobito Velho'],
  Lobito: ['Restinga', 'Compão', 'Canata'],
  Catumbela: ['Catumbela Centro', 'Gama', 'Biópio'],
  Lubango: ['Mapunda', 'Tchioco', 'Nambambe'],
  Chibia: ['Cacula', 'Jau', 'Quihita'],
  Humpata: ['Humpata Centro', 'Neves Bendinha', 'Kuvango'],
  Huambo: ['São Pedro', 'Calomanda', 'Samissassa'],
  'Caála': ['Sede', 'Catchiungo', 'Katchiungo'],
  Bailundo: ['Bailundo Centro', 'Tchikala', 'Lunge'],
}

export const defaultPhoto =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'

export const starterListings = [
  {
    id: 'l-1',
    category: 'Imóvel',
    operation: 'Arrendamento',
    propertyType: 'Apartamento',
    title: 'T3 moderno no Talatona',
    price: 850000,
    province: 'Luanda',
    municipality: 'Talatona',
    neighborhood: 'Cidade Financeira',
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    ownerName: 'Adriano Manuel',
    ownerType: 'Proprietário Particular',
    phone: '+244923000111',
    ownerEmail: 'adriano.manuel@email.ao',
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: false,
    trustSeal: 'Prata',
    status: 'Ativo',
    featured: true,
    description:
      'Apartamento com segurança 24h, estacionamento e acesso rápido à via expressa.',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['Estacionamento', 'Segurança 24h', 'Elevador'],
    rules: ['Contrato mínimo 12 meses', 'Caução equivalente a 2 meses'],
    documentation: ['Escritura disponível', 'Certidão predial'],
    views: 128,
    reference: 'KT-1001',
    slug: 't3-moderno-talatona',
    lat: 0.64,
    lng: 0.74,
    createdAt: '2026-06-01',
  },
  {
    id: 'l-2',
    category: 'Imóvel',
    operation: 'Venda',
    propertyType: 'Vivenda',
    title: 'Vivenda T4 no Kilamba',
    price: 215000000,
    province: 'Luanda',
    municipality: 'Kilamba Kiaxi',
    neighborhood: 'Nova Vida',
    bedrooms: 4,
    bathrooms: 4,
    area: 280,
    ownerName: 'Nova Era Imobiliária',
    ownerType: 'Empresa Imobiliária',
    phone: '+244937000222',
    ownerEmail: 'contacto@novaera.ao',
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: true,
    trustSeal: 'Ouro',
    status: 'Ativo',
    featured: true,
    description:
      'Empreendimento com documentação em dia e financiamento possível.',
    photos: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['Piscina', 'Jardim', 'Garagem dupla'],
    documentation: ['Escritura', 'Planta aprovada'],
    views: 256,
    reference: 'KT-1002',
    slug: 'vivenda-t4-kilamba',
    lat: 0.52,
    lng: 0.66,
    createdAt: '2026-06-10',
  },
  {
    id: 'l-3',
    category: 'Veículo',
    operation: 'Venda',
    title: 'Toyota Prado 2019',
    price: 42000000,
    province: 'Luanda',
    municipality: 'Viana',
    neighborhood: 'Zango',
    brand: 'Toyota',
    model: 'Prado',
    year: 2019,
    mileage: 68000,
    fuel: 'Diesel',
    gearbox: 'Automática',
    condition: 'Semi-novo',
    ownerName: 'Stand Kilamba Motors',
    ownerType: 'Agente Imobiliário',
    phone: '+244936000333',
    ownerEmail: 'vendas@kilambamotors.ao',
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: true,
    trustSeal: 'Ouro',
    status: 'Ativo',
    featured: false,
    description:
      'Veículo em excelente estado, revisão completa e histórico disponível.',
    photos: [
      'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494976388531-d105849445c3?auto=format&fit=crop&w=1200&q=80',
    ],
    views: 89,
    reference: 'KT-2001',
    slug: 'toyota-prado-2019',
    lat: 0.74,
    lng: 0.49,
    createdAt: '2026-05-28',
  },
]

export const emptyListing = {
  category: 'Imóvel',
  operation: 'Arrendamento',
  propertyType: 'Apartamento',
  title: '',
  price: '',
  province: 'Luanda',
  municipality: 'Talatona',
  neighborhood: 'Cidade Financeira',
  bedrooms: '',
  bathrooms: '',
  area: '',
  brand: '',
  model: '',
  year: '',
  mileage: '',
  fuel: 'Gasolina',
  gearbox: 'Automática',
  condition: 'Semi-novo',
  description: '',
  photos: [],
}

export const defaultFilters = {
  query: '',
  category: 'Todos',
  operation: 'Todos',
  propertyType: 'Todos',
  province: 'Todos',
  municipality: 'Todos',
  neighborhood: 'Todos',
  minPrice: '',
  maxPrice: '',
  minBedrooms: '',
  minBathrooms: '',
  minArea: '',
  brand: '',
  model: '',
  yearMin: '',
  yearMax: '',
  mileageMax: '',
  fuel: 'Todos',
  gearbox: 'Todos',
  condition: 'Todos',
  sort: 'recent',
  view: 'grid',
  gridSize: 'md',
  page: '1',
}

export const defaultProfile = {
  name: '',
  email: '',
  phone: '',
  type: accountTypes[0],
  role: '',
  verified: false,
  verifiedProfile: false,
  verifiedPhone: false,
  verifiedDocument: false,
  phoneVerified: false,
  documentsVerified: false,
  authProvider: '',
  googleId: '',
  sessionId: '',
  picture: '',
  avatar: '',
  emailVerified: false,
  userRole: '',
  buyerOnboardingDone: false,
  createdAt: '',
  subscription: '',
  preferredProvince: '',
  language: 'pt-AO',
  currency: 'AOA',
}

export const buyerPropertyTypes = [
  { id: 'casa', label: 'Casa / Vivenda', icon: 'home', category: 'Imóvel', propertyType: 'Vivenda' },
  { id: 'apartamento', label: 'Apartamento', icon: 'building', category: 'Imóvel', propertyType: 'Apartamento' },
  { id: 'terreno', label: 'Terreno', icon: 'land', category: 'Imóvel', propertyType: 'Terreno' },
  { id: 'loja', label: 'Loja / Escritório', icon: 'store', category: 'Imóvel', propertyType: 'Loja' },
  { id: 'carro', label: 'Carro', icon: 'car', category: 'Veículo', propertyType: '' },
  { id: 'pickup', label: 'Pickup / SUV', icon: 'truck', category: 'Veículo', propertyType: '' },
]

/** Tipos de imóvel — secção Arrendar / Comprar */
export const rentPropertyTypes = [
  { id: 'todos', label: 'Todos', icon: 'search', propertyType: 'Todos' },
  { id: 'apartamento', label: 'Apartamento', icon: 'building', propertyType: 'Apartamento' },
  { id: 'vivenda', label: 'Casa / Vivenda', icon: 'home', propertyType: 'Vivenda' },
  { id: 'quarto', label: 'Quarto', icon: 'bed', propertyType: 'Quarto' },
  { id: 'terreno', label: 'Terreno', icon: 'land', propertyType: 'Terreno' },
  { id: 'loja', label: 'Loja', icon: 'store', propertyType: 'Loja' },
  { id: 'escritorio', label: 'Escritório', icon: 'building', propertyType: 'Escritório' },
  { id: 'armazem', label: 'Armazém', icon: 'store', propertyType: 'Armazém' },
]

export const salePropertyTypes = rentPropertyTypes

export const vehicleBrowseTypes = [
  { id: 'todos', label: 'Todos', icon: 'search', propertyType: 'Todos' },
  { id: 'carro', label: 'Carros', icon: 'car', propertyType: 'Veículo' },
  { id: 'pickup', label: 'Pickup / SUV', icon: 'truck', propertyType: 'Veículo' },
]

export const buyerOperations = [
  { id: 'comprar', label: 'Comprar', operation: 'Venda' },
  { id: 'arrendar', label: 'Arrendar', operation: 'Arrendamento' },
]

export const defaultBuyerPrefs = {
  propertyTypeId: '',
  operationId: '',
  province: 'Luanda',
  maxPrice: '',
  bedrooms: '',
}
