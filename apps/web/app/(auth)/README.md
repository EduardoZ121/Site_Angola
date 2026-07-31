# (auth) route group

Rotas PRD-001 (§12.1):

| Rota                        | Função                                         |
| --------------------------- | ---------------------------------------------- |
| `/auth`                     | Redirect → registar ou `?mode=entrar` → entrar |
| `/auth/registar`            | F1                                             |
| `/auth/entrar`              | F3                                             |
| `/auth/verificar`           | F2                                             |
| `/auth/recuperar`           | F5 pedido                                      |
| `/auth/recuperar/confirmar` | F5 nova password                               |
| `/auth/onboarding/papeis`   | F6 papéis                                      |
| `/auth/onboarding/perfil`   | F6 perfil                                      |
| `/auth/sair`                | F4 logout (POST/GET)                           |

UI: `modules/authentication`. Spec §18 wireframes.  
`AuthPlaceholderClient` deixou de ser a UI de produto.
