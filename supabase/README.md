# Supabase — Kuteka

Migrations versionadas e seeds oficiais.

## Comandos

```bash
# Local (Docker) — NÃO prova o remoto
supabase start
supabase db reset   # aplica migrations + seeds localmente

# Remoto (P2 do Engineering Gate)
supabase db push    # projecto ligado / --linked
# ou SQL Editor: colar 0002_p0_rbac_and_audit_hardening.sql
```

## Migrations

| Ficheiro                               | Conteúdo                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `0001_foundation.sql`                  | profiles, roles, permissions, user_roles, audit_logs, RLS, storage buckets |
| `0002_p0_rbac_and_audit_hardening.sql` | RPCs RBAC + endurecimento audit_logs (P0)                                  |

## Seeds

- `seed/0001_roles.sql` — **fonte de verdade** do mapeamento role→permission inicial

## Regras P0

- App resolve permissões via `get_user_permission_codes` / `fetchAuthorizationContext`
- Auditoria só via `write_audit_log` / `writeAuditLog`

## Evidência P2 (remoto)

Após aplicar `0002` no projecto remoto, registar em `docs/backlog/PRD_001_ENGINEERING_GATE.md` §8.2:

- project ref
- data
- quem aplicou
- checklist `docs/security/AUDIT_LOGS_CHECKLIST.md` ✅

Ver ADR-001 e ADR-003.
