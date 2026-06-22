import { Link, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function PublishPage() {
  const navigate = useNavigate()
  const {
    profile,
    listingForm,
    provinces,
    bairros,
    updateListingField,
    handlePhotoUpload,
    submitListing,
  } = useMarketplace()

  function handleSubmit(event) {
    const newId = submitListing(event)
    if (newId) navigate(`/anuncio/${newId}`)
  }

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Publicar"
        title="Coloque o seu anúncio online"
        subtitle="Página dedicada para proprietários, agentes e empresas."
      />

      <SectionBlock
        id="perfil-check"
        eyebrow="Passo 1"
        title="Perfil do anunciante"
        subtitle="Complete nome e telefone antes de publicar."
        tone="muted"
      >
        <div className="panel-card intro-panel">
          {!profile.name || !profile.phone ? (
            <>
              <p className="warning-text">Perfil incompleto.</p>
              <Link className="button primary" to="/conta">
                Ir para Minha conta
              </Link>
            </>
          ) : (
            <p className="success-text">
              Perfil pronto: {profile.name} • {profile.phone}
            </p>
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        id="formulario"
        eyebrow="Passo 2"
        title="Detalhes do anúncio"
        subtitle="Imóvel ou veículo, fotos, preço em Kz e localização."
      >
        <form className="owner-form panel-card" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Categoria
              <select
                value={listingForm.category}
                onChange={(event) => updateListingField('category', event.target.value)}
              >
                <option>Imóvel</option>
                <option>Veículo</option>
              </select>
            </label>
            <label>
              Operação
              <select
                value={listingForm.operation}
                onChange={(event) => updateListingField('operation', event.target.value)}
              >
                <option>Arrendamento</option>
                <option>Venda</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            {listingForm.category === 'Imóvel' ? (
              <label>
                Tipo de imóvel
                <select
                  value={listingForm.propertyType}
                  onChange={(event) => updateListingField('propertyType', event.target.value)}
                >
                  <option>Apartamento</option>
                  <option>Vivenda</option>
                  <option>Terreno</option>
                  <option>Loja</option>
                </select>
              </label>
            ) : (
              <label>
                Marca
                <input
                  value={listingForm.brand}
                  onChange={(event) => updateListingField('brand', event.target.value)}
                />
              </label>
            )}
            <label>
              Título
              <input
                required
                value={listingForm.title}
                onChange={(event) => updateListingField('title', event.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Preço (Kz)
              <input
                required
                type="number"
                value={listingForm.price}
                onChange={(event) => updateListingField('price', event.target.value)}
              />
            </label>
            <label>
              Província
              <select
                value={listingForm.province}
                onChange={(event) => updateListingField('province', event.target.value)}
              >
                {Object.keys(provinces).map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Município
              <select
                value={listingForm.municipality}
                onChange={(event) => updateListingField('municipality', event.target.value)}
              >
                {(provinces[listingForm.province] || []).map((municipality) => (
                  <option key={municipality}>{municipality}</option>
                ))}
              </select>
            </label>
            <label>
              Bairro
              <select
                value={listingForm.neighborhood}
                onChange={(event) => updateListingField('neighborhood', event.target.value)}
              >
                {(bairros[listingForm.municipality] || []).map((neighborhood) => (
                  <option key={neighborhood}>{neighborhood}</option>
                ))}
              </select>
            </label>
          </div>

          {listingForm.category === 'Imóvel' ? (
            <div className="form-row">
              <label>
                Quartos
                <input
                  type="number"
                  value={listingForm.bedrooms}
                  onChange={(event) => updateListingField('bedrooms', event.target.value)}
                />
              </label>
              <label>
                Casas de banho
                <input
                  type="number"
                  value={listingForm.bathrooms}
                  onChange={(event) => updateListingField('bathrooms', event.target.value)}
                />
              </label>
              <label>
                Área (m²)
                <input
                  type="number"
                  value={listingForm.area}
                  onChange={(event) => updateListingField('area', event.target.value)}
                />
              </label>
            </div>
          ) : (
            <div className="form-row">
              <label>
                Modelo
                <input
                  value={listingForm.model}
                  onChange={(event) => updateListingField('model', event.target.value)}
                />
              </label>
              <label>
                Ano
                <input
                  type="number"
                  value={listingForm.year}
                  onChange={(event) => updateListingField('year', event.target.value)}
                />
              </label>
              <label>
                Quilometragem
                <input
                  type="number"
                  value={listingForm.mileage}
                  onChange={(event) => updateListingField('mileage', event.target.value)}
                />
              </label>
            </div>
          )}

          <label>
            Descrição
            <textarea
              rows="4"
              value={listingForm.description}
              onChange={(event) => updateListingField('description', event.target.value)}
            />
          </label>

          <label className="upload-box">
            Fotos do anúncio
            <input accept="image/*" multiple type="file" onChange={handlePhotoUpload} />
            <span>Escolha até 5 fotos.</span>
          </label>

          {listingForm.photos.length > 0 && (
            <div className="preview-strip">
              {listingForm.photos.map((photo, index) => (
                <img src={photo} alt={`Pré-visualização ${index + 1}`} key={photo} />
              ))}
            </div>
          )}

          <button className="button primary" type="submit">
            Publicar para aprovação
          </button>
        </form>
      </SectionBlock>
    </main>
  )
}
