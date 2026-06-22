import { useMarketplace } from '../context/MarketplaceContext'
import { Toggle } from '../components/ui'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import { trustSealFromProfile } from '../utils/format'

export default function AccountPage() {
  const { profile, setProfile, accountTypes } = useMarketplace()

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Minha conta"
        title="Perfil e verificação"
        subtitle="Página separada para configurar o seu perfil antes de publicar."
      />

      <SectionBlock id="dados" eyebrow="Dados" title="Informações pessoais">
        <form className="owner-form panel-card">
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
                onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Telefone (+244...)
              <input
                value={profile.phone}
                onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              />
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
                onToggle={() => setProfile((current) => ({ ...current, verifiedProfile: !current.verifiedProfile }))}
              />
              <Toggle
                label="Telefone verificado"
                checked={profile.verifiedPhone}
                onToggle={() => setProfile((current) => ({ ...current, verifiedPhone: !current.verifiedPhone }))}
              />
              <Toggle
                label="Documento validado"
                checked={profile.verifiedDocument}
                onToggle={() => setProfile((current) => ({ ...current, verifiedDocument: !current.verifiedDocument }))}
              />
            </div>
          </div>
          <aside className="trust-card panel-card">
            <strong>Selo de confiança</strong>
            <p>{trustSealFromProfile(profile)}</p>
            <small>Anúncios com selo recebem mais contactos directos.</small>
          </aside>
        </div>
      </SectionBlock>
    </main>
  )
}
