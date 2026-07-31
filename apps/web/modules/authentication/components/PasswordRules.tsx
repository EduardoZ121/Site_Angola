import { passwordRules } from '@kuteka/validation';
import { getAuthCopy } from '../content';

interface PasswordRulesProps {
  password: string;
}

export function PasswordRules({ password }: PasswordRulesProps) {
  const copy = getAuthCopy();
  const rules = [
    { id: 'min', label: copy.register.password.ruleMin, ok: passwordRules.minLength(password) },
    { id: 'upper', label: copy.register.password.ruleUpper, ok: passwordRules.hasUpper(password) },
    {
      id: 'number',
      label: copy.register.password.ruleNumber,
      ok: passwordRules.hasDigit(password),
    },
  ];

  return (
    <ul className="mt-2 space-y-1.5" aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-2 text-sm ${rule.ok ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <span aria-hidden className="font-mono text-xs">
            {rule.ok ? '✓' : '○'}
          </span>
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
