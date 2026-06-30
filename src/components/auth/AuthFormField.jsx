import { HelpTip } from '../ui/HelpTip'

export function AuthFormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required = true,
  tip,
}) {
  return (
    <label className="auth-form-field" htmlFor={id}>
      <span className="auth-form-label">
        {label}
        {tip ? <HelpTip label={label} text={tip} /> : null}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
      />
    </label>
  )
}
