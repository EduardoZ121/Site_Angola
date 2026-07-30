-- verify-p0-migration.sql
-- Auxílio ops para P2 do Engineering Gate.
-- NÃO marca o Gate como concluído — apenas ajuda a recolher evidência.
-- Executar no SQL Editor do projecto Supabase REMOTO após aplicar 0002.

select to_regprocedure('public.get_user_role_codes(uuid)') as get_user_role_codes;
select to_regprocedure('public.get_user_permission_codes(uuid)') as get_user_permission_codes;
select to_regprocedure('public.user_has_permission(uuid, text)') as user_has_permission;
select to_regprocedure('public.write_audit_log(text, text, text, jsonb)') as write_audit_log;

-- Esperado: quatro OID não-nulos. Se algum for null, a migration 0002 não está aplicada (ou assinatura diverge).
