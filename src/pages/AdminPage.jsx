import { ADMIN_EMAIL } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatKz } from '../utils/format'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function AdminPage() {
  const {
    listings,
    adminEmail,
    setAdminEmail,
    isAdmin,
    adminStats,
    updateListing,
    deleteListing,
  } = useMarketplace()

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Admin"
        title="Painel de moderação"
        subtitle="Página separada — não misturada com anúncios públicos."
      />

      <SectionBlock id="acesso" eyebrow="Acesso" title="Entrar como administrador" tone="muted">
        <div className="admin-card panel-card">
          <label>
            Email admin demo
            <input
              placeholder={ADMIN_EMAIL}
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
          </label>
          <small>
            Para testar agora, use: <strong>{ADMIN_EMAIL}</strong>
          </small>
        </div>
      </SectionBlock>

      <SectionBlock
        id="moderacao"
        eyebrow="Anúncios"
        title={isAdmin ? 'Gerir anúncios' : 'Área bloqueada'}
        subtitle={isAdmin ? 'Aprove, pause, destaque ou apague anúncios.' : 'Insira o email admin demo acima.'}
      >
        {isAdmin ? (
          <>
            <div className="admin-stats">
              <span>Total: {adminStats.total}</span>
              <span>Ativos: {adminStats.active}</span>
              <span>Pendentes: {adminStats.pending}</span>
              <span>Destaques: {adminStats.featured}</span>
            </div>
            <div className="admin-list">
              {listings.map((listing) => (
                <div className="admin-row panel-card" key={listing.id}>
                  <div>
                    <strong>{listing.title}</strong>
                    <span>
                      {listing.neighborhood} — {formatKz(listing.price)}
                    </span>
                  </div>
                  <div className="admin-actions">
                    <button
                      type="button"
                      onClick={() =>
                        updateListing(listing.id, {
                          status: listing.status === 'Ativo' ? 'Pausado' : 'Ativo',
                        })
                      }
                    >
                      {listing.status === 'Ativo' ? 'Pausar' : 'Aprovar'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateListing(listing.id, { featured: !listing.featured })
                      }
                    >
                      {listing.featured ? 'Remover destaque' : 'Destacar'}
                    </button>
                    <button type="button" onClick={() => deleteListing(listing.id)}>
                      Apagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="locked-admin panel-card">
            <strong>Admin bloqueado</strong>
            <span>Insira o email admin demo para ver os controlos.</span>
          </div>
        )}
      </SectionBlock>
    </main>
  )
}
