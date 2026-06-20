import { ADMIN_EMAIL } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatKz } from '../utils/format'

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
      <section className="page-hero compact admin-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Admin</p>
          <h1>Painel de moderação</h1>
          <p className="page-subtitle">Página separada — não misturada com anúncios públicos.</p>
        </div>
      </section>

      <section className="section page-section">
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
                  <div className="admin-row" key={listing.id}>
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
            <div className="locked-admin">
              <strong>Admin bloqueado</strong>
              <span>Insira o email admin demo para ver os controlos.</span>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
