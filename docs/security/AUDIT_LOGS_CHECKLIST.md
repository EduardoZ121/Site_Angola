# Checklist de segurança — Audit logs (P0-2)

Após aplicar `supabase/migrations/0002_p0_rbac_and_audit_hardening.sql`:

- [ ] Policy `audit_logs_insert_authenticated` **não** existe
- [ ] `authenticated` / `anon` **não** têm GRANT INSERT/UPDATE/DELETE em `audit_logs`
- [ ] `write_audit_log` existe e é `security definer`
- [ ] `authenticated` pode `EXECUTE` em `write_audit_log`
- [ ] SELECT próprio continua possível (`audit_logs_select_own`)
- [ ] Código da app usa `writeAuditLog` / RPC — nunca `.from('audit_logs').insert(...)`
- [ ] Tentativa de insert directo com anon key falha (teste manual / SQL)

## Verificação SQL sugerida

```sql
-- Deve falhar para role authenticated (via teste com JWT de user)
-- insert into public.audit_logs (actor_id, action) values (auth.uid(), 'tamper');

-- Deve funcionar
-- select public.write_audit_log('auth.test', 'user', auth.uid()::text, '{}'::jsonb);
```
