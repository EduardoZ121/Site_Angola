# Matriz inicial de permissões

**Fonte de verdade:** `supabase/seed/0001_roles.sql` + tabelas PostgreSQL  
**Resolução runtime:** `get_user_permission_codes(user_id)` (migration `0002`)  
**App:** `@kuteka/auth` só avalia arrays já resolvidos — **sem** matriz TypeScript paralela.

| Permissão           | client | patrimonial_partner | certified_agent | administrator |
| ------------------- | ------ | ------------------- | --------------- | ------------- |
| `platform.access`   | ✓      | ✓                   | ✓               | ✓             |
| `admin.panel`       |        |                     |                 | ✓             |
| `properties.manage` |        | ✓                   |                 | ✓             |
| `housing.explore`   | ✓      |                     |                 | ✓             |
| `agent.operate`     |        |                     | ✓               | ✓             |
| `trust.manage`      | ✓      | ✓                   | ✓               | ✓             |

Novos papéis / permissões = novos rows + seed/migration — sem alterar o modelo RBAC.
