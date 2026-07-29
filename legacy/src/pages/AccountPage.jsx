import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { userRoles } from '../data/constants'
import { AGENT_APPLICATION_STATUS_LABELS } from '../constants/agentApplication'
import { VISIT_STATUS_LABELS } from '../constants/visits'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { AccountCrossNav } from '../components/account/AccountCrossNav'
import { AccountNotificationsList } from '../components/account/AccountNotificationsList'
import { AccountQuickNav } from '../components/account/AccountQuickNav'
import { AccountSessionCard } from '../components/account/AccountSessionCard'
import { AccountSummaryBar } from '../components/account/AccountSummaryBar'
import { HelpTip } from '../components/ui/HelpTip'
import { Toggle } from '../components/ui'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import { computeAccountSummary, getListingAccountLink } from '../utils/account'
import { isValidAngolaPhone } from '../utils/profile'
import { isVisitUpcoming } from '../utils/visits'
import { formatKz, trustSealFromProfile } from '../utils/format'
import '../styles/account.css'

const statusLabels = {
  Pendente: 'Em revisão',
  Ativo: 'Publicado',
  Pausado: 'Pausado',
  Rejeitado: 'Rejeitado',
}

export default function AccountPage() {
  const {
    profile,
    setProfile,
    accountTypes,
    getMyListings,
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    logoutAccount,
    isAgent,
    isAdmin,
    getMyAgentApplication,
    getMyVisits,
  } = useMarketplace()

  const myListings = getMyListings()
  const notifications = getMyNotifications()
  const agentApplication = getMyAgentApplication()
  const myVisits = getMyVisits().filter(isVisitUpcoming)

  const summary = useMemo(
    () => computeAccountSummary(profile, notifications, myListings),
    [profile, notifications, myListings],
  )

  useEffect(() => {
    document.title = 'Minha conta | Kuteka'
    const hash = window.location.hash
    if (!hash) return
    const target = document.querySelector(hash)
    if (target) {
      window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [])

  const phoneHint = !profile.phone?.trim()
    ? 'Obrigatório para publicar — número móvel angolano (+244 9XX).'
    : !isValidAngolaPhone(profile.phone)
      ? 'Formato inválido — use +244 9XX XXX XXX.'
      : 'Telefone válido para contactos de compradores.'

  return (
    <main className="page-main account-page">
      <PageIntro
        eyebrow="Minha conta"
        title="Perfil e verificação"
        subtitle="Gerir dados, mensagens e confiança — tudo ligado aos seus anúncios Kuteka."
      />

      <div className="account-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Minha conta', to: '/conta' },
          ]}
        />

        <p className="account-help-line">
          Complete nome e telefone para publicar sem bloqueios.
          <HelpTip
            label="Ajuda: conta"
            text="Notificações são locais (demo). Em produção receberia email sobre aprovações, visitas e mensagens."
          />
        </p>

        <AccountSummaryBar summary={summary} />
        <AccountQuickNav showVisits={myVisits.length > 0} />

        <SectionBlock id="sessao" eyebrow="Sessão" title="Conta activa" tone="muted">
          <AccountSessionCard profile={profile} onLogout={logoutAccount} />
        </SectionBlock>

        {myVisits.length ? (
          <SectionBlock id="visitas" eyebrow="Visitas" title="Visitas agendadas aos seus anúncios">
            <div className="agent-visits-list">
              {myVisits.map((visit) => (
                <article className="agent-visit-card panel-card" key={visit.id}>
                  <strong>{visit.listingTitle}</strong>
                  <p>{new Date(visit.scheduledAt).toLocaleString('pt-PT')}</p>
                  <p>{visit.location}</p>
                  <p>
                    Agente: {visit.agentName}
                    {visit.agentPhone ? ` • ${visit.agentPhone}` : ''}
                  </p>
                  {visit.buyerName ? <p>Interessado: {visit.buyerName}</p> : null}
                  {visit.notes ? <p className="staff-inquiry-msg">{visit.notes}</p> : null}
                  <span className="status-pill status-invited">
                    {VISIT_STATUS_LABELS[visit.status]}
                  </span>
                </article>
              ))}
            </div>
            <p className="account-meta-line">
              Também recebe alerta por email quando o agente agenda (demo local).
            </p>
          </SectionBlock>
        ) : null}

        {!isAdmin && !isAgent ? (
          <SectionBlock id="agente-kuteka" eyebrow="Carreira" title="Trabalhar na Kuteka" tone="muted">
            <div className="panel-card account-agent-card">
              <p>Quer ser intermediário imobiliário? Envie apresentação e CV opcional.</p>
              {agentApplication ? (
                <p>
                  <strong>Estado:</strong>{' '}
                  {AGENT_APPLICATION_STATUS_LABELS[agentApplication.status] || agentApplication.status}
                </p>
              ) : null}
              <Link className="button primary" to="/seja-agente">
                Candidatar-me a agente
              </Link>
            </div>
          </SectionBlock>
        ) : null}

        <SectionBlock id="mensagens" eyebrow="Mensagens" title="Notificações e email">
          <AccountNotificationsList
            notifications={notifications}
            profileEmail={profile.email}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
          />
        </SectionBlock>

        <SectionBlock id="meus-anuncios" eyebrow="Publicações" title="Os meus anúncios" tone="muted">
          <div className="panel-card intro-panel account-panel-cta">
            <p>Gerir anúncios, estatísticas e destaques no painel do proprietário.</p>
            <Link className="button primary" to="/painel">
              Abrir painel
            </Link>
          </div>
          {myListings.length === 0 ? (
            <div className="empty-state panel-card">
              <p>Ainda não publicou nenhum anúncio.</p>
              <Link className="button primary" to="/publicar">
                Publicar agora
              </Link>
            </div>
          ) : (
            <div className="my-listings-list">
              {myListings.map((listing) => (
                <article className="my-listing-row panel-card" key={listing.id}>
                  <div>
                    <strong>{listing.title}</strong>
                    <p>
                      {formatKz(listing.price)} — {listing.neighborhood}
                    </p>
                  </div>
                  <span className={`status-pill status-${listing.status.toLowerCase()}`}>
                    {statusLabels[listing.status] || listing.status}
                  </span>
                  <Link className="text-button" to={getListingAccountLink(listing)}>
                    Abrir
                  </Link>
                </article>
              ))}
            </div>
          )}
        </SectionBlock>

        <SectionBlock id="dados" eyebrow="Dados" title="Informações pessoais">
          <form className="owner-form panel-card account-profile-form">
            <div className="form-row">
              <label>
                Nome
                <input
                  value={profile.name}
                  onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  value={profile.email}
                  readOnly={profile.authProvider === 'google'}
                  onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Telefone (+244...)
                <input
                  value={profile.phone}
                  placeholder="+244 923 456 789"
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                />
                <small className={isValidAngolaPhone(profile.phone) ? 'field-ok' : 'field-warn'}>
                  {phoneHint}
                </small>
              </label>
              <label>
                Tipo de conta
                <select
                  value={profile.type}
                  onChange={(event) => setProfile((current) => ({ ...current, type: event.target.value }))}
                >
                  {accountTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
            {profile.userRole ? (
              <p className="account-meta-line">
                Perfil Kuteka:{' '}
                <strong>
                  {profile.userRole === userRoles.owner ? 'Proprietário' : 'Comprador'}
                </strong>
                {' · '}
                <Link className="text-button" to="/escolher-perfil">
                  Alterar perfil
                </Link>
              </p>
            ) : null}
          </form>
        </SectionBlock>

        <SectionBlock
          id="verificacao"
          eyebrow="Confiança"
          title="Verificação e selo"
          subtitle="Active as verificações para aumentar contactos."
          tone="muted"
        >
          <div className="profile-grid">
            <div className="panel-card">
              <div className="toggle-row">
                <Toggle
                  label="Perfil verificado"
                  checked={profile.verifiedProfile}
                  onToggle={() =>
                    setProfile((current) => ({ ...current, verifiedProfile: !current.verifiedProfile }))
                  }
                />
                <Toggle
                  label="Telefone verificado"
                  checked={profile.verifiedPhone}
                  onToggle={() =>
                    setProfile((current) => ({ ...current, verifiedPhone: !current.verifiedPhone }))
                  }
                />
                <Toggle
                  label="Documento validado"
                  checked={profile.verifiedDocument}
                  onToggle={() =>
                    setProfile((current) => ({ ...current, verifiedDocument: !current.verifiedDocument }))
                  }
                />
              </div>
            </div>
            <aside className="trust-card panel-card">
              <strong>Selo de confiança</strong>
              <p>{trustSealFromProfile(profile)}</p>
              <small>Anúncios com selo recebem mais contactos directos.</small>
              {summary.completeness.missing.length ? (
                <ul className="account-missing-list">
                  {summary.completeness.missing.map((item) => (
                    <li key={item.id}>Falta: {item.label}</li>
                  ))}
                </ul>
              ) : null}
            </aside>
          </div>
        </SectionBlock>

        <SectionBlock
          id="planos"
          eyebrow="Planos"
          title="Destaques e preços"
          subtitle="Sem pagamentos na plataforma — planos e referências de mercado."
          tone="muted"
        >
          <div className="account-plans-grid">
            <article className="panel-card account-plan-card">
              <strong>Destacar anúncio</strong>
              <p>Renove destaque no painel ou veja planos disponíveis.</p>
              <Link className="button filter-button" to="/destaques">
                Ver destaques
              </Link>
            </article>
            <article className="panel-card account-plan-card">
              <strong>Preços por zona</strong>
              <p>Compare valores em Kwanza antes de definir o preço do anúncio.</p>
              <Link className="button filter-button" to="/precos">
                Ver preços
              </Link>
            </article>
          </div>
        </SectionBlock>

        <AccountCrossNav />
      </div>
    </main>
  )
}
