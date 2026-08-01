# (app) route group

Área autenticada — **Platform Shell** (Fase 3 + PRD-002…006).

| Rota                     | Função                                  |
| ------------------------ | --------------------------------------- |
| `/app`                   | Home operacional                        |
| `/app/patrimonios`       | Patrimónios (PRD-002)                   |
| `/app/habitacao`         | Habitação / Cliente (PRD-003)           |
| `/app/agente`            | Agente Certificado (PRD-004)            |
| `/app/admin`             | Administração (PRD-005 · `admin.panel`) |
| `/app/confianca`         | Confiança (PRD-006 · `trust.manage`)    |
| `/app/confianca/revisao` | Fila de revisão (`admin.panel`)         |

Layout: `AppShell` (gate) + `PlatformShell` (Sidebar + Topbar + Main). Sessão: `kuteka-auth`.
