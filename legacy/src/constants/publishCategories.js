export const PUBLISH_CATEGORIES = [
  {
    id: 'Apartamento',
    label: 'Apartamento',
    category: 'Imóvel',
    propertyType: 'Apartamento',
    icon: 'building',
    description: 'Apartamentos T0–T6',
    subtitle: 'Comprar ou arrendar',
    image:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'Casa',
    label: 'Vivenda',
    category: 'Imóvel',
    propertyType: 'Vivenda',
    icon: 'home',
    description: 'Moradias e condomínios',
    subtitle: 'Comprar ou arrendar',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'Quarto',
    label: 'Quarto',
    category: 'Imóvel',
    propertyType: 'Quarto',
    icon: 'bed',
    description: 'Quartos individuais',
    subtitle: 'Arrendamento',
    image:
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'Veiculo',
    label: 'Veículo',
    category: 'Veículo',
    propertyType: 'Veículo',
    icon: 'car',
    description: 'Carros, pickups e SUV',
    subtitle: 'Venda',
    image:
      'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'Loja',
    label: 'Loja',
    category: 'Imóvel',
    propertyType: 'Loja',
    icon: 'store',
    description: 'Espaços comerciais',
    subtitle: 'Comprar ou arrendar',
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'Terreno',
    label: 'Terreno',
    category: 'Imóvel',
    propertyType: 'Terreno',
    icon: 'land',
    description: 'Urbanos e rurais',
    subtitle: 'Venda',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'Escritorio',
    label: 'Escritório',
    category: 'Imóvel',
    propertyType: 'Escritório',
    icon: 'building',
    description: 'Escritórios e salas',
    subtitle: 'Arrendamento',
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'Armazem',
    label: 'Armazém',
    category: 'Imóvel',
    propertyType: 'Armazém',
    icon: 'store',
    description: 'Armazéns e logística',
    subtitle: 'Arrendamento',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=70',
  },
]

export const PUBLISH_STEPS = [
  { id: 'category', label: 'Categoria' },
  { id: 'basic', label: 'Informações' },
  { id: 'location', label: 'Localização' },
  { id: 'features', label: 'Características' },
  { id: 'media', label: 'Fotos' },
  { id: 'pricing', label: 'Preço' },
  { id: 'contact', label: 'Contacto' },
  { id: 'preview', label: 'Revisão' },
]

export const PUBLISH_TIPS = [
  'Coloque pelo menos 8 fotos.',
  'Tire fotos durante o dia.',
  'Escreva uma descrição completa.',
  'Responda rapidamente aos compradores.',
  'Actualize o anúncio regularmente.',
]

export const PUBLISH_FUTURE_FEATURES = [
  'Publicação Premium',
  'Destacar anúncio',
  'Subir para o topo',
  'Agendar publicação',
  'Vídeo do imóvel',
  'Tour 360°',
  'IA para gerar descrição',
  'IA para melhorar título',
  'Estimativa automática de preço',
  'Rascunhos',
  'Duplicar anúncio',
  'Publicação para agentes',
  'Publicação para empresas',
]

export function getCategoryConfig(listingCategory) {
  return PUBLISH_CATEGORIES.find((item) => item.id === listingCategory) || PUBLISH_CATEGORIES[0]
}

export function isVehicleCategory(listingCategory) {
  return listingCategory === 'Veiculo'
}

export function isPropertyWithRooms(listingCategory) {
  return ['Apartamento', 'Casa', 'Quarto'].includes(listingCategory)
}
