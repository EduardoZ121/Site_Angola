# Contas Founder / Gestão Institucional

| Campo          | Valor                                        |
| -------------- | -------------------------------------------- |
| **Sprint**     | Beta 1.6                                     |
| **Migrations** | `0036`, `0037`, `0038`                       |
| **Identidade** | Sempre `user_id` (UUID) — o email pode mudar |

## Princípio

Founder ≠ Super Admin. O vínculo institucional está em `public.founders` (`user_id`, `is_founder`, `is_owner`). Trocar email **não** quebra permissões.

## 1. Bootstrap do primeiro Founder (único)

1. Criar conta Auth normal (não `demo.*`).
2. Iniciar sessão → `/app/super` → separador **Gestão Institucional**.
3. Se `founder_bootstrap_status().bootstrapOpen = true`, clicar **Assumir como Founder/Owner**.
4. Após sucesso, o bootstrap fica **permanentemente bloqueado**.

RPC: `founder_bootstrap_claim`. Contas `demo.%@kuteka.local` são rejeitadas.

## 2. Promover utilizadores

No mesmo separador (só Founder/Owner):

- Founder / Co-Founder / Super Admin / Admin / Supervisor / Auditor
- **Motivo obrigatório** → Audit Center

RPC: `founder_promote_user(user_id, role, reason)`.

## 3. Alterar email com segurança

Centro de Segurança → Alterar email:

1. Novo email
2. Códigos no email antigo + novo (beta: códigos devolvidos inline até SMTP)
3. Confirmação → `auth.users.email` actualizado
4. Auditoria completa

O `user_id` e a linha em `founders` **não mudam**.

## 4. Contas `demo.*`

Marcadas `profiles.is_system_demo = true` / `account_kind = system_demo`.

- Permanecem para testes, vídeos, formação
- **Nunca** para administração de produção
- **Não** podem ser Founder nem promovidas

## 5. Identidade visual

| Papel           | Cor     |
| --------------- | ------- |
| Founder / Owner | Azul    |
| Co-Founder      | Ciano   |
| Super Admin     | Roxo    |
| Admin           | Verde   |
| Supervisor      | Laranja |
| System Demo     | Cinza   |

Visível no menu da conta (`useInstitutionalIdentity`).
