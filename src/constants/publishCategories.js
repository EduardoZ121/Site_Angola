export const PUBLISH_CATEGORIES = [
  { id: 'Apartamento', label: 'Apartamento', category: 'Imóvel', propertyType: 'Apartamento' },
  { id: 'Casa', label: 'Casa / Vivenda', category: 'Imóvel', propertyType: 'Vivenda' },
  { id: 'Quarto', label: 'Quarto', category: 'Imóvel', propertyType: 'Quarto' },
  { id: 'Terreno', label: 'Terreno', category: 'Imóvel', propertyType: 'Terreno' },
  { id: 'Loja', label: 'Loja', category: 'Imóvel', propertyType: 'Loja' },
  { id: 'Escritorio', label: 'Escritório', category: 'Imóvel', propertyType: 'Escritório' },
  { id: 'Armazem', label: 'Armazém', category: 'Imóvel', propertyType: 'Armazém' },
  { id: 'Veiculo', label: 'Veículo', category: 'Veículo', propertyType: 'Veículo' },
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

export function getCategoryConfig(listingCategory) {
  return PUBLISH_CATEGORIES.find((item) => item.id === listingCategory) || PUBLISH_CATEGORIES[0]
}

export function isVehicleCategory(listingCategory) {
  return listingCategory === 'Veiculo'
}

export function isPropertyWithRooms(listingCategory) {
  return ['Apartamento', 'Casa', 'Quarto'].includes(listingCategory)
}
