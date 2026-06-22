import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userRoles } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const { isLoggedIn, profile, setUserRole, needsRoleSelection } = useMarketplace()

  useEffect(() => {
    if (!isLoggedIn) navigate('/cadastro', { replace: true })
    else if (!needsRoleSelection) navigate('/inicio', { replace: true })
  }, [isLoggedIn, needsRoleSelection, navigate])

  function chooseOwner() {
    setUserRole(userRoles.owner)
    navigate('/inicio', { replace: true })
  }

  function chooseBuyer() {
    setUserRole(userRoles.buyer)
    navigate('/procurar', { replace: true })
  }

  if (!isLoggedIn || !needsRoleSelection) return null

  return (
    <div className="onboarding-screen">
      <div className="onboarding-card onboarding-wide">
        <img className="onboarding-logo" src="/kuteka-logo.svg" alt="Kuteka" />
        <p className="eyebrow">Passo 1</p>
        <h1>Olá{profile.name ? `, ${profile.name.split(' ')[0]}` : ''}! Como quer usar o Kuteka?</h1>
        <p className="onboarding-lead">
          Escolha o seu perfil. Depois levamos-lo ao sítio certo no site.
        </p>

        <div className="role-grid">
          <button className="role-card" type="button" onClick={chooseBuyer}>
            <span className="role-icon" aria-hidden="true">
              🔍
            </span>
            <strong>Sou comprador</strong>
            <span>Quero comprar ou arrendar casa, terreno ou carro.</span>
            <em>Responder questionário →</em>
          </button>

          <button className="role-card role-card-owner" type="button" onClick={chooseOwner}>
            <span className="role-icon" aria-hidden="true">
              🏡
            </span>
            <strong>Sou proprietário</strong>
            <span>Quero publicar imóvel ou veículo e receber contactos.</span>
            <em>Ir para área do senhorio →</em>
          </button>
        </div>
      </div>
    </div>
  )
}
