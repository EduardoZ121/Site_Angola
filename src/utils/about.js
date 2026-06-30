import { computeHomeMarketStats } from './homeStats'

export const ABOUT_MISSION = [
  {
    icon: 'shield',
    title: 'Confiança em Angola',
    description: 'Verificação de anunciantes, selos de confiança e revisão de anúncios antes de publicar.',
  },
  {
    icon: 'mobile',
    title: 'Mobile-first',
    description: 'Optimizado para telemóvel — pesquisa, filtros e contacto em poucos toques.',
  },
  {
    icon: 'handshake',
    title: 'Ligação directa',
    description: 'A Kuteka conecta compradores e senhorios — negócio e pagamento ficam entre as partes.',
  },
]

export const ABOUT_LEGAL_SECTIONS = [
  {
    id: 'termos',
    title: 'Termos de uso',
    paragraphs: [
      'Ao utilizar a Kuteka, concorda em publicar informações verdadeiras, respeitar outros utilizadores e não partilhar conteúdo ilegal ou enganoso.',
      'Anúncios podem passar por revisão antes de ficarem públicos. Reservamo-nos o direito de remover conteúdo que viole estas regras.',
      'A Kuteka actua como plataforma de ligação — contratos, visitas e pagamentos são acordados directamente entre comprador e vendedor ou senhorio.',
      'Planos destaque e funcionalidades premium podem ter condições adicionais indicadas no painel do proprietário.',
    ],
  },
  {
    id: 'privacidade',
    title: 'Privacidade',
    paragraphs: [
      'Os seus dados (nome, email, telefone) servem para gerir conta, anúncios, favoritos e contactos com anunciantes.',
      'Mensagens e favoritos guardados localmente nesta versão demo permanecem no seu dispositivo até sincronização futura.',
      'Não vendemos dados pessoais a terceiros. Pode actualizar informações em Minha conta.',
      'Para questões sobre privacidade: contacto@kutekalink.com.',
    ],
  },
  {
    id: 'contacto',
    title: 'Contacto',
    paragraphs: [
      'Email: contacto@kutekalink.com',
      'Suporte para anunciantes e compradores via conta Kuteka e painel do proprietário.',
      'Agentes certificados: candidatura em «Seja agente» após criar conta.',
    ],
    links: [
      { to: '/como-funciona', label: 'Como funciona' },
      { to: '/conta', label: 'Minha conta' },
      { to: '/seja-agente', label: 'Seja agente' },
    ],
  },
]

export function buildAboutLiveStats(listings = []) {
  const live = computeHomeMarketStats(listings)
  return [
    { value: live.totalActive, suffix: '', label: 'Anúncios activos' },
    { value: live.forSale, suffix: '', label: 'Imóveis à venda' },
    { value: live.forRent, suffix: '', label: 'Arrendamentos' },
    { value: live.vehicles, suffix: '', label: 'Veículos' },
    { value: live.provinces, suffix: '', label: 'Províncias' },
  ]
}
