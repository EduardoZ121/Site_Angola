import { formatStaffDate } from '../../utils/admin'

export function AdminUsersTable({ users = [], onCopyEmails }) {
  if (!users.length) {
    return (
      <div className="empty-state panel-card">
        <p>Ainda ninguém entrou neste ambiente (demo local).</p>
      </div>
    )
  }

  return (
    <>
      <div className="admin-actions admin-users-toolbar">
        <button className="button filter-button" type="button" onClick={onCopyEmails}>
          Copiar emails
        </button>
        <span className="admin-users-count">{users.length} contas</span>
      </div>
      <div className="admin-users-table panel-card">
        <table className="compare-table admin-table">
          <thead>
            <tr>
              <th>Utilizador</th>
              <th>Email</th>
              <th>Primeiro login</th>
              <th>Último login</th>
              <th>Vezes</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email}>
                <td>
                  <span className="admin-user-cell">
                    {user.picture ? <img className="nav-user-avatar" src={user.picture} alt="" /> : null}
                    {user.name}
                  </span>
                </td>
                <td>{user.email}</td>
                <td>{formatStaffDate(user.firstLoginAt)}</td>
                <td>{formatStaffDate(user.lastLoginAt)}</td>
                <td>{user.loginCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
