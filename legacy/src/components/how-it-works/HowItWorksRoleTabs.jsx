import { HOW_IT_WORKS_ROLES } from '../../utils/howItWorks'

export function HowItWorksRoleTabs({ activeRole, onChange }) {
  return (
    <div className="hiw-role-tabs" role="tablist" aria-label="Perfil">
      {HOW_IT_WORKS_ROLES.map((role) => (
        <button
          key={role.id}
          type="button"
          role="tab"
          aria-selected={activeRole === role.id}
          className={`hiw-role-tab${activeRole === role.id ? ' active' : ''}`}
          onClick={() => onChange(role.id)}
        >
          {role.label}
        </button>
      ))}
    </div>
  )
}
