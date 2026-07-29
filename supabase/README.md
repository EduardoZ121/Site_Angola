# Supabase — Kuteka

Migrations versionadas e seeds oficiais.

## Comandos

```bash
# Requer Supabase CLI + Docker (local) ou projecto remoto ligado
supabase start
supabase db reset   # aplica migrations + seeds
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

Ver ADR-001 e ADR-003.
