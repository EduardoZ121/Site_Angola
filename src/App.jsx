import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MarketplaceProvider } from './context/MarketplaceContext'
import HomePage from './pages/HomePage'
import ListingsPage from './pages/ListingsPage'
import FiltersMapPage from './pages/FiltersMapPage'
import ListingDetailPage from './pages/ListingDetailPage'
import PublishPage from './pages/PublishPage'
import AccountPage from './pages/AccountPage'
import FavoritesPage from './pages/FavoritesPage'
import ComparePage from './pages/ComparePage'
import PricesPage from './pages/PricesPage'
import AdminPage from './pages/AdminPage'
import AddPropertyPage from './pages/AddPropertyPage'
import AddPropertyDetailsPage from './pages/AddPropertyDetailsPage'
import './layout.css'
import './App.css'

export default function App() {
  return (
    <MarketplaceProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route
            path="comprar"
            element={
              <ListingsPage
                basePath="comprar"
                title="Comprar imóveis"
                subtitle="Casas, apartamentos, terrenos e lojas para venda em Angola."
                defaultCategory="Imóvel"
                defaultOperation="Venda"
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
                subtitle="Arrendamentos mensais com contacto directo ao senhorio."
                defaultCategory="Imóvel"
                defaultOperation="Arrendamento"
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
                subtitle="Carros e pickups para compra, com filtros por marca e modelo."
                defaultCategory="Veículo"
                defaultOperation="Todos"
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
          <Route path="adicionar-propriedade" element={<AddPropertyPage />} />
          <Route path="adicionar-propriedade/detalhes" element={<AddPropertyDetailsPage />} />
          <Route path="publicar" element={<PublishPage />} />
          <Route path="conta" element={<AccountPage />} />
          <Route path="favoritos" element={<FavoritesPage />} />
          <Route path="comparar" element={<ComparePage />} />
          <Route path="precos" element={<PricesPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </MarketplaceProvider>
  )
}
