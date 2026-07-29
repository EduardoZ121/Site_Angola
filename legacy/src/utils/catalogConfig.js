export const CATALOG_SECTIONS = {
  comprar: {
    breadcrumbLabel: 'Comprar',
    crossLinks: [
      { to: '/arrendar', label: 'Arrendar', icon: 'building' },
      { to: '/veiculos', label: 'Veículos', icon: 'car' },
      { to: '/explorar', label: 'Explorar', icon: 'search' },
      { to: '/precos', label: 'Preços por zona', icon: 'chart' },
    ],
    resultSingular: 'imóvel à venda',
    resultPlural: 'imóveis à venda',
    priceInsightLabel: 'preço médio',
    priceInsightHelp: 'Calculado com base nos resultados actuais do catálogo (filtros aplicados).',
    secondaryLink: { to: '/precos', label: 'Ver relatório por zona' },
    emptyDescription:
      'Não há imóveis à venda com estes filtros. Experimente alargar a zona ou o preço.',
    emptyLinks: [
      { to: '/arrendar', label: 'Ver arrendamentos' },
      { to: '/explorar', label: 'Explorar marketplace' },
    ],
    typeHelp: 'Números actualizados com base nos filtros de localização e preço activos.',
    typeHeading: 'Escolha o tipo',
    typeGridLabel: 'Tipo de imóvel',
    monthlyPrice: false,
  },
  arrendar: {
    breadcrumbLabel: 'Arrendar',
    crossLinks: [
      { to: '/comprar', label: 'Comprar', icon: 'home' },
      { to: '/veiculos', label: 'Veículos', icon: 'car' },
      { to: '/explorar', label: 'Explorar', icon: 'search' },
      { to: '/publicar', label: 'Publicar imóvel', icon: 'edit' },
    ],
    resultSingular: 'imóvel para arrendar',
    resultPlural: 'imóveis para arrendar',
    priceInsightLabel: 'renda média mensal',
    priceInsightHelp:
      'Média das rendas mensais (Kz) nos resultados actuais — filtros aplicados.',
    secondaryLink: { to: '/como-funciona', label: 'Como funciona o arrendamento' },
    emptyDescription:
      'Não há imóveis para arrendar com estes filtros. Alargue a zona ou o intervalo de renda.',
    emptyLinks: [
      { to: '/comprar', label: 'Ver imóveis à venda' },
      { to: '/explorar', label: 'Explorar marketplace' },
    ],
    typeHelp:
      'Contagens actualizadas — rendas mensais em Kz conforme localização e filtros activos.',
    typeHeading: 'Escolha o tipo',
    typeGridLabel: 'Tipo de imóvel',
    monthlyPrice: true,
  },
  veiculos: {
    breadcrumbLabel: 'Veículos',
    crossLinks: [
      { to: '/comprar', label: 'Comprar', icon: 'home' },
      { to: '/arrendar', label: 'Arrendar', icon: 'building' },
      { to: '/explorar', label: 'Explorar', icon: 'search' },
      { to: '/comparar', label: 'Comparar', icon: 'columns' },
    ],
    resultSingular: 'veículo',
    resultPlural: 'veículos',
    priceInsightLabel: 'preço médio',
    priceInsightHelp:
      'Média dos preços de venda nos resultados actuais — filtros aplicados.',
    secondaryLink: { to: '/comparar', label: 'Comparar veículos' },
    emptyDescription:
      'Nenhum veículo corresponde a estes filtros. Experimente outra marca, ano ou zona.',
    emptyLinks: [
      { to: '/comprar', label: 'Ver imóveis à venda' },
      { to: '/explorar', label: 'Explorar marketplace' },
    ],
    typeHelp:
      'Contagens por tipo — actualizadas conforme marca, preço e localização activos.',
    typeHeading: 'Tipo de veículo',
    typeGridLabel: 'Tipo de veículo',
    searchPlaceholder: 'Marca, modelo, zona...',
    monthlyPrice: false,
  },
}

export function getCatalogSection(basePath) {
  return CATALOG_SECTIONS[basePath] ?? null
}

export function isPropertyCatalog(basePath) {
  return Boolean(CATALOG_SECTIONS[basePath])
}

export function isCatalogSection(basePath) {
  return Boolean(CATALOG_SECTIONS[basePath])
}
