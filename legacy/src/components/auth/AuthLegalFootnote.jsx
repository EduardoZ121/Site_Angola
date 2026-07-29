import { Link } from 'react-router-dom'

export function AuthLegalFootnote() {
  return (
    <p className="auth-facebook-foot">
      Ao usar o Kuteka, concorda com os{' '}
      <Link to="/sobre#termos">Termos de uso</Link> e a{' '}
      <Link to="/sobre#privacidade">Política de privacidade</Link>.
    </p>
  )
}
