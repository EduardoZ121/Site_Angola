# Contas Founder / Owner

| Campo         | Valor                            |
| ------------- | -------------------------------- |
| **Sprint**    | Beta 1.6                         |
| **Migration** | `0036_trust_governance_gate.sql` |
| **Tabela**    | `public.founders`                |

## Objectivo

Deixar de depender de `demo.super@kuteka.local`. Os Fundadores ficam numa tabela própria (`user_id`, `is_founder`, `is_owner`) para poder alterar o email da conta sem reescrever permissões.

Privilégios: **Founder/Owner > Super Administrador** (via `is_founder` / `is_platform_owner` + `user_has_founder_or_permission`).

## Como ligar contas reais (PO)

1. Criar as contas Auth normais (registo no site) com os emails reais dos fundadores.
2. No SQL Editor do Supabase (service role / owner), depois de cada utilizador existir em `auth.users`:

```sql
-- Substituir pelo UUID real de auth.users
select public.founder_link_user(
  '<user-uuid>'::uuid,
  true,                 -- is_owner (apenas o Owner principal)
  'Founder / Owner'
);
```

Para um segundo Founder (sem Owner):

```sql
select public.founder_link_user('<user-uuid>'::uuid, false, 'Founder');
```

3. Bootstrap: se ainda **não** existir nenhum `is_owner`, um utilizador com `finance.manage` (ex.: Super Admin legado) pode chamar `founder_link_user` uma vez para criar o Owner. Depois só o Owner liga novos Founders.

4. Desactivar / deixar de usar `demo.super@kuteka.local` em produção (manter só em staging se necessário).

## Comissão de activação

Parâmetro `activation_intermediation_first_month_pct` (default **35%**) em `platform_commission_params`.
Alterar só com Founder/Owner:

```sql
select public.founder_set_commission_param(
  'activation_intermediation_first_month_pct',
  35.0,
  'Nota opcional'
);
```

(UI Super/Founder para este parâmetro pode seguir na Fase B.)
