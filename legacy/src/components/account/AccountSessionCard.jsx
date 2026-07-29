export function AccountSessionCard({ profile, onLogout }) {
  const isGoogle = profile.authProvider === 'google'

  return (
    <div className="account-session-card panel-card">
      <div className="profile-review-head">
        {profile.picture ? (
          <img className="nav-user-avatar large" src={profile.picture} alt="" />
        ) : (
          <span className="profile-avatar">{profile.name?.charAt(0) || '?'}</span>
        )}
        <div>
          <strong>{profile.name || 'Utilizador Kuteka'}</strong>
          <p>{profile.email || 'Sem email'}</p>
          <small>
            {isGoogle ? 'Conta Google' : 'Conta email'} • notificações activas (demo local)
          </small>
        </div>
      </div>
      <button className="text-button" type="button" onClick={onLogout}>
        {isGoogle ? 'Terminar sessão Google' : 'Terminar sessão'}
      </button>
    </div>
  )
}
