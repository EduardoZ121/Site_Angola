# Supabase — Kuteka

Migrations versionadas e seeds de fundação (FASE 1).

## Comandos

```bash
# Requer Supabase CLI + Docker (local) ou projecto remoto ligado
supabase start
supabase db reset   # aplica migrations + seeds
```

## Conteúdo FASE 1

- `migrations/0001_foundation.sql` — profiles, roles, permissions, user_roles, audit_logs, RLS, storage buckets
- `seed/0001_roles.sql` — roles oficiais + papéis futuros reservados + permissões esqueleto

Ver ADR-001 e FASE 1 Spec.
