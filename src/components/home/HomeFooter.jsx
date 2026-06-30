import { Link } from 'react-router-dom'

export function HomeFooter() {
  return (
    <footer className="hp-footer">
      <div className="hp-container hp-footer-grid">
        <div className="hp-footer-brand">
          <img src="/kuteka-logo.svg" alt="Kuteka" className="hp-footer-logo" />
          <p>Marketplace de imóveis e veículos para Angola. Confiança, clareza e preços em Kz.</p>
        </div>
        <div>
          <strong>Descobrir</strong>
          <Link to="/explorar">Explorar categorias</Link>
          <Link to="/destaques">Anúncios em destaque</Link>
          <Link to="/como-funciona">Como funciona</Link>
        </div>
        <div>
          <strong>Categorias</strong>
          <Link to="/comprar">Comprar imóveis</Link>
          <Link to="/arrendar">Arrendar imóveis</Link>
          <Link to="/veiculos">Veículos</Link>
          <Link to="/publicar">Publicar anúncio</Link>
        </div>
        <div>
          <strong>Empresa</strong>
          <Link to="/sobre">Sobre a Kuteka</Link>
          <Link to="/precos">Preços por zona</Link>
          <span className="hp-footer-soon">Blog — Em breve</span>
        </div>
        <div>
          <strong>Ajuda</strong>
          <Link to="/entrar">Entrar</Link>
          <Link to="/cadastro">Criar conta</Link>
          <span className="hp-footer-soon">Centro de ajuda — Em breve</span>
        </div>
        <div>
          <strong>Contacto</strong>
          <a href="mailto:contacto@kutekalink.com">contacto@kutekalink.com</a>
          <a href="https://wa.me/244923000000" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <span className="hp-footer-soon">Facebook • Instagram</span>
        </div>
      </div>
      <div className="hp-container hp-footer-bottom">
        <span>© {new Date().getFullYear()} Kuteka. Todos os direitos reservados.</span>
        <div className="hp-footer-legal">
          <span>Termos de uso</span>
          <span>Privacidade</span>
        </div>
      </div>
    </footer>
  )
}
