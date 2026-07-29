# @kuteka/auth

RBAC helpers for multi-role Kuteka accounts.

## Source of truth (P0-1)

- **Official store:** PostgreSQL tables `roles`, `permissions`, `role_permissions`, `user_roles`
- **Resolution:** `get_user_role_codes` / `get_user_permission_codes` (migration `0002`)
- **App helpers:** operate on **already resolved** `roles` + `permissions` arrays — they do **not** embed a permission matrix

Load context with `@kuteka/database` → `fetchAuthorizationContext`.

## Model

- Identity = User
- Roles assigned via `user_roles` (N:N)
- Authorization by **permission / capability**, not `if (role === …)` in UI

Full auth UI belongs to PRD-001 (after P0 complete).
