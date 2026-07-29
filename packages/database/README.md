# @kuteka/database

Typed Supabase client helpers for browser, server (SSR cookies) and service-role (server-only).

## Authorization (P0)

- `fetchAuthorizationContext(client, userId, email?)` — roles + permissions from DB RPCs
- `writeAuditLog(client, input)` — controlled audit write (`write_audit_log` security definer)

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.  
Never `insert` into `audit_logs` from client code — use `writeAuditLog`.
