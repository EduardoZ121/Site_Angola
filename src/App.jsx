import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import {
  RequireAdmin,
  RequireAuth,
  RequireRoleForPublish,
  RequireStaff,
  RootRedirect,
} from './components/RequireAuth'
import { LoginPromptProvider } from './context/LoginPromptContext'
import { MarketplaceProvider } from './context/MarketplaceContext'
import HomePage from './pages/HomePage'
import { rentPropertyTypes, salePropertyTypes, vehicleBrowseTypes } from './data/constants'
import ExplorePage from './pages/ExplorePage'
import FeaturedHubPage from './pages/FeaturedHubPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AboutPage from './pages/AboutPage'
import ListingsPage from './pages/ListingsPage'
import FiltersMapPage from './pages/FiltersMapPage'
import ListingDetailPage from './pages/ListingDetailPage'
import PublishPage from './pages/PublishPage'
import PublishSubmittedPage from './pages/PublishSubmittedPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import EditListingPage from './pages/EditListingPage'
import AccountPage from './pages/AccountPage'
import FavoritesPage from './pages/FavoritesPage'
import ComparePage from './pages/ComparePage'
import PricesPage from './pages/PricesPage'
import AdminPage from './pages/AdminPage'
import AgentPage from './pages/AgentPage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RoleSelectPage from './pages/RoleSelectPage'
import BuyerFlowPage from './pages/BuyerFlowPage'
import AddPropertyPage from './pages/AddPropertyPage'
import AddPropertyDetailsPage from './pages/AddPropertyDetailsPage'
import './layout.css'
import './App.css'

export default function App() {
  return (
    <MarketplaceProvider>
      <LoginPromptProvider>
        <Routes>
          <Route path="/cadastro" element={<SignupPage />} />
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/escolher-perfil" element={<RoleSelectPage />} />
          <Route path="/procurar" element={<BuyerFlowPage />} />
          <Route path="/" element={<RootRedirect />} />

          <Route element={<Layout />}>
            <Route path="inicio" element={<HomePage />} />
            <Route path="explorar" element={<ExplorePage />} />
            <Route path="destaques" element={<FeaturedHubPage />} />
            <Route path="como-funciona" element={<HowItWorksPage />} />
            <Route path="sobre" element={<AboutPage />} />
            <Route
              path="comprar"
              element={
                <ListingsPage
                  basePath="comprar"
                  title="Comprar imóveis"
                  subtitle="Casas, apartamentos, terrenos e lojas para venda em Angola."
                  defaultCategory="Imóvel"
                  defaultOperation="Venda"
                  propertyTypes={salePropertyTypes}
                  showFeatured
                  featuredTitle="Destaques à venda"
                />
              }
            />
            <Route
              path="comprar/filtros"
              element={
                <FiltersMapPage
                  basePath="comprar"
                  title="Filtros — Comprar imóveis"
                  subtitle="Escolha a zona no mapa, ajuste preço e localização, depois confirme."
                  defaultCategory="Imóvel"
                  defaultOperation="Venda"
                />
              }
            />
            <Route
              path="arrendar"
              element={
                <ListingsPage
                  basePath="arrendar"
                  title="Arrendar imóveis"
                  subtitle="Apartamentos, casas, quartos e lojas — arrendamento mensal em Kz."
                  defaultCategory="Imóvel"
                  defaultOperation="Arrendamento"
                  propertyTypes={rentPropertyTypes}
                  showFeatured
                  featuredTitle="Destaques para arrendar"
                />
              }
            />
            <Route
              path="arrendar/filtros"
              element={
                <FiltersMapPage
                  basePath="arrendar"
                  title="Filtros — Arrendar imóveis"
                  subtitle="Escolha a zona no mapa, ajuste preço e localização, depois confirme."
                  defaultCategory="Imóvel"
                  defaultOperation="Arrendamento"
                />
              }
            />
            <Route
              path="veiculos"
              element={
                <ListingsPage
                  basePath="veiculos"
                  title="Veículos"
                  subtitle="Carros e pickups com filtros por marca, modelo e preço."
                  defaultCategory="Veículo"
                  defaultOperation="Todos"
                  propertyTypes={vehicleBrowseTypes}
                  showFeatured
                  featuredTitle="Veículos em destaque"
                />
              }
            />
            <Route
              path="veiculos/filtros"
              element={
                <FiltersMapPage
                  basePath="veiculos"
                  title="Filtros — Veículos"
                  subtitle="Escolha zona, marca, modelo e preço, depois confirme."
                  defaultCategory="Veículo"
                  defaultOperation="Todos"
                  showVehicleFilters
                />
              }
            />
            <Route path="anuncio/:id" element={<ListingDetailPage />} />
            <Route path="precos" element={<PricesPage />} />
            <Route path="comparar" element={<ComparePage />} />

            <Route element={<RequireAuth />}>
              <Route path="conta" element={<AccountPage />} />
              <Route path="favoritos" element={<FavoritesPage />} />
            </Route>

            <Route element={<RequireRoleForPublish />}>
              <Route path="publicar" element={<PublishPage />} />
              <Route path="publicar/enviado/:id" element={<PublishSubmittedPage />} />
              <Route path="painel" element={<OwnerDashboardPage />} />
              <Route path="painel/editar/:id" element={<EditListingPage />} />
              <Route path="adicionar-propriedade" element={<AddPropertyPage />} />
              <Route path="adicionar-propriedade/detalhes" element={<AddPropertyDetailsPage />} />
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>

            <Route element={<RequireStaff />}>
              <Route path="agente" element={<AgentPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Route>
        </Routes>
      </LoginPromptProvider>
    </MarketplaceProvider>
  )
}
