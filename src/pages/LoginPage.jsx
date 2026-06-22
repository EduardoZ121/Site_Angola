import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleAuthButton } from '../components/GoogleAuthButton'
import { useMarketplace } from '../context/MarketplaceContext'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

const benefits = [
  {
    icon: '✉️',
    title: 'Emails automáticos',
    text: 'Receba avisos quando o anúncio for aprovado, rejeitado ou publicado.',
  },
  {
    icon: '🔐',
    title: 'Conta segura',
    text: 'Entre com Google — sem criar palavra-passe extra no Kuteka.',
  },
  {
    icon: '🏠',
    title: 'Publicar imóveis e veículos',
    text: 'Perfil ligado ao email para moderar anúncios e evitar perfis falsos.',
  },
  {
    icon: '🔔',
    title: 'Mensagens na conta',
    text: 'Todas as notificações ficam na sua área pessoal e no email.',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, loginWithGoogle, isLoggedIn } = useMarketplace()
  const redirectTo = searchParams.get('redirect') || '/conta'

  function handleGoogleCredential(credential) {
    const ok = loginWithGoogle(credential)
    if (ok) navigate(redirectTo, { replace: true })
  }

  if (isLoggedIn) {
    return (
      <main className="page-main">
        <PageIntro eyebrow="Conta" title="Já tem sessão iniciada" subtitle={`Sessão: ${profile.email}`} />
        <SectionBlock>
          <div className="empty-state panel-card">
            <Link className="button primary" to="/conta">
              Ir para Minha conta
            </Link>
          </div>
        </SectionBlock>
      </main>
    )
  }

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Entrar"
        title="Criar conta com Google"
        subtitle="Use o seu email Google para receber informações e gerir anúncios no Kuteka."
      />

      <SectionBlock id="google-login" eyebrow="Conta Google" title="Entrar ou registar" tone="muted">
        <div className="google-login-card panel-card">
          <div className="add-property-intro-head">
            <span className="add-property-icon" aria-hidden="true">
              G
            </span>
            <div>
              <strong>Continuar com Google</strong>
              <p>
                Cria a sua conta em segundos. Usamos o email Google para enviar confirmações de
                publicação, aprovação do administrador e alertas importantes.
              </p>
            </div>
          </div>

          <GoogleAuthButton onCredential={handleGoogleCredential} />

          <ul className="google-login-notes">
            <li>O Kuteka não publica nada sem a sua confirmação.</li>
            <li>Anúncios passam sempre por aprovação do administrador.</li>
            <li>Pode completar telefone e tipo de conta depois do login.</li>
          </ul>
        </div>
      </SectionBlock>

      <SectionBlock id="beneficios" eyebrow="Porquê Google?" title="O que ganha com a conta">
        <div className="tools-grid google-benefits-grid">
          {benefits.map((item) => (
            <article className="tool-card" key={item.title}>
              <span className="browse-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock id="sem-google" eyebrow="Alternativa" title="Prefere continuar sem Google?" tone="muted">
        <div className="panel-card">
          <p>Pode preencher nome e email manualmente em Minha conta, mas não receberá emails automáticos até ligar o Google.</p>
          <Link className="text-button" to="/conta">
            Ir para Minha conta (manual)
          </Link>
        </div>
      </SectionBlock>
    </main>
  )
}
