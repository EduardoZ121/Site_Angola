import { CategoriesSection } from '../components/home/CategoriesSection'
import { HomeSubPageLayout } from '../components/home/HomeSubPageLayout'
import { QuickSearchSection } from '../components/home/QuickSearchSection'
import '../styles/home.css'

export default function ExplorePage() {
  return (
    <HomeSubPageLayout
      eyebrow="Explorar"
      title="O que procura?"
      lead="Pesquisas frequentes e categorias com filtros por zona e preço em Kz."
    >
      <QuickSearchSection compact />
      <CategoriesSection hideHead />
    </HomeSubPageLayout>
  )
}
