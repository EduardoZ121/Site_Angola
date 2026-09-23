# RLS / permission matrix — regression contract

**Companion:** `supabase/tests/rls_permission_matrix_doc.sql`  
**Helpers:** `packages/auth` (`assertClientDeniedSensitive`, matrix helpers)  
**Last ecosystem pass:** migrations 0043–0048

## Must remain true

1. Clients cannot call Founder-only RPCs (`founder_set_commission_param`, bootstrap claim without secret).
2. `beta_feedback` insert only via `kocc_submit_beta_feedback` (RPC-only after 0045).
3. Availability notify only for non-demo, non-already-available properties.
4. `assign_property_interest` requires `agent.operate` (or admin) and open interest.
5. Kuteka Pay custody stays `none` / sandbox until Founder + legal go-live (`PENDING_FOUNDER_DECISIONS.md`).

## How to re-verify

```bash
pnpm --filter @kuteka/auth test
pnpm --filter @kuteka/web test
# Optional: supabase db test / psql -f supabase/tests/rls_permission_matrix_doc.sql
```

Do not weaken RLS “for convenience” without Founder authorization and an audit log.
