import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MarketplaceProvider } from './context/MarketplaceContext'
import HomePage from './pages/HomePage'
import ListingsPage from './pages/ListingsPage'
import ListingDetailPage from './pages/ListingDetailPage'
import PublishPage from './pages/PublishPage'
import AccountPage from './pages/AccountPage'
import FavoritesPage from './pages/FavoritesPage'
import ComparePage from './pages/ComparePage'
import PricesPage from './pages/PricesPage'
import AdminPage from './pages/AdminPage'
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
                title="Comprar imóveis"
                subtitle="Casas, apartamentos, terrenos e lojas para venda em Angola."
                defaultCategory="Imóvel"
                defaultOperation="Venda"
              />
            }
          />
          <Route
            path="arrendar"
            element={
              <ListingsPage
                title="Arrendar imóveis"
                subtitle="Arrendamentos mensais com contacto directo ao senhorio."
                defaultCategory="Imóvel"
                defaultOperation="Arrendamento"
              />
            }
          />
          <Route
            path="veiculos"
            element={
              <ListingsPage
                title="Veículos"
                subtitle="Carros e pickups para compra, com filtros por marca e modelo."
                defaultCategory="Veículo"
                defaultOperation="Todos"
                showVehicleFilters
              />
            }
          />
          <Route path="anuncio/:id" element={<ListingDetailPage />} />
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
