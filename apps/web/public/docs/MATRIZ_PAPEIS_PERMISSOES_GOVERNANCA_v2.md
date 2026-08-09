# KUTEKA — MATRIZ DE PAPÉIS, PERMISSÕES E GOVERNANÇA

**Versão:** 2.0 · **Data:** 2026-08-09

**Auditoria:** `docs/product/MANUAL_PLATFORM_AUDIT_SNAP_2026-08-09.md`

Legenda nas células de acção: 🟢 permitido/implementado · 🟡 parcial · 🔴 negado/não existe · 🔵 preparado · ⚪ planeado v1.1+

UI permissions = intersection(session permissions, MODE_LENS[experience]). RLS usa permissões reais.

## 1. ExperienceMode ↔ papéis DB

| ExperienceMode (UI)   | Papéis DB que o activam        | Home                      |
| --------------------- | ------------------------------ | ------------------------- |
| `client`              | `client`                       | `/app/habitacao/explorar` |
| `patrimonial_partner` | `patrimonial_partner`          | `/app/patrimonios`        |
| `client_partner`      | `client + patrimonial_partner` | `/app`                    |
| `certified_agent`     | `certified_agent`              | `/app/agente`             |
| `service_provider`    | `service_provider`             | `/app/servicos`           |
| `supervisor`          | `supervisor`                   | `/app/admin`              |
| `administrator`       | `administrator`                | `/app/admin`              |
| `super_administrator` | `super_administrator`          | `/app/super`              |
| `founder`             | `founder **ou** co_founder`    | `/app/fundador`           |

Sem ExperienceMode UI: `auditor`, Board, Investor ⚪/🔴. KAI não é papel.

## 2. MODE_LENS — códigos de permissão por experiência

Fonte: `apps/web/modules/shell/role-experience.ts` → `MODE_LENS`.

| Permissão           | Cli | PP  | C+P | Ag  | Pr  | Sup | Adm | Super | Found |
| ------------------- | --- | --- | --- | --- | --- | --- | --- | ----- | ----- |
| `admin.panel`       | —   | —   | —   | —   | —   | 🟢  | 🟢  | 🟢    | 🟢    |
| `agent.operate`     | —   | —   | —   | 🟢  | —   | 🟢  | 🟢  | 🟢    | 🟢    |
| `audit.read`        | —   | —   | —   | —   | —   | 🟢  | 🟢  | 🟢    | 🟢    |
| `contracts.manage`  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢    | 🟢    |
| `executive.panel`   | —   | —   | —   | —   | —   | —   | —   | 🟢    | 🟢    |
| `finance.manage`    | —   | —   | —   | —   | —   | —   | —   | 🟢    | 🟢    |
| `finance.read`      | —   | —   | —   | —   | —   | —   | 🟢  | 🟢    | 🟢    |
| `founder.manage`    | —   | —   | —   | —   | —   | —   | —   | —     | 🟢    |
| `housing.explore`   | 🟢  | —   | 🟢  | 🟢  | —   | 🟢  | 🟢  | 🟢    | 🟢    |
| `moderation.manage` | —   | —   | —   | —   | —   | 🟢  | 🟢  | 🟢    | 🟢    |
| `platform.access`   | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢    | 🟢    |
| `properties.manage` | —   | 🟢  | 🟢  | —   | —   | —   | —   | —     | —     |
| `properties.review` | —   | —   | —   | —   | —   | 🟢  | 🟢  | 🟢    | 🟢    |
| `reputation.manage` | 🟢  | 🟢  | 🟢  | 🟢  | —   | —   | 🟢  | 🟢    | 🟢    |
| `services.operate`  | —   | —   | —   | —   | 🟢  | —   | —   | —     | —     |
| `trust.manage`      | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢    | 🟢    |

Notas: `services.operate` aparece no lens do Prestador; path `/app/servicos` também aceita `platform.access`. Códigos adicionais podem existir só na BD sem lens UI.

## 3. Path rules (canAccessPath)

| Prefixo            | Permissões efectivas exigidas (any)         |
| ------------------ | ------------------------------------------- |
| `/app/patrimonios` | `properties.manage`                         |
| `/app/habitacao`   | `housing.explore`                           |
| `/app/agente`      | `agent.operate`                             |
| `/app/admin`       | `admin.panel` **ou** `properties.review`    |
| `/app/confianca`   | `trust.manage`                              |
| `/app/contratos`   | `contracts.manage`                          |
| `/app/super`       | `finance.manage` **ou** `founder.manage`    |
| `/app/servicos`    | `services.operate` **ou** `platform.access` |
| `/app/fundador`    | sem PATH_RULE (bootstrap)                   |

## 4. Matriz gigante Papel × capacidade

Colunas: Dashboard/Home · Menu principal · Ver · Criar · Editar · Aprovar · Pendenciar · Escalar · Chat · Avaliar · Gestão users.

| Papel          | Dashboard               | Menu                 | Ver           | Criar                | Editar           | Aprovar     | Pendenciar | Escalar        | Chat            | Avaliar           | Gestão users             |
| -------------- | ----------------------- | -------------------- | ------------- | -------------------- | ---------------- | ----------- | ---------- | -------------- | --------------- | ----------------- | ------------------------ |
| Cliente        | /app/habitacao/explorar | Explorar+Cliente     | 🟢 feed       | 🔴 património alheio | 🔴               | 🔴          | 🔴         | 🔴             | 🟡 list/pairing | 🟢 social/reviews | 🔴                       |
| PP             | /app/patrimonios        | Parceiro+geral       | 🟢 próprios   | 🟢 activar           | 🟢 próprios      | 🔴 auto     | 🔴         | 🔴             | 🟡              | 🟡                | 🔴                       |
| C+P            | /app                    | Cliente+Parceiro     | 🟢            | 🟢                   | 🟢 próprios      | 🔴          | 🔴         | 🔴             | 🟡              | 🟢/🟡             | 🔴                       |
| Agente         | /app/agente             | Agente+explorar      | 🟢 atribuídos | 🟡 visitas/rel       | 🟡 parcial       | 🔴          | 🔴         | 🔴 reporta Sup | 🟡              | 🟡                | 🔴                       |
| Prestador      | /app/servicos           | Prestador            | 🟢 inbox      | 🟡 orçamento         | 🟡 execução      | 🔴          | 🔴         | 🔴             | 🟡              | 🟡 avaliação      | 🔴                       |
| Supervisor     | /app/admin              | Admin+agente         | 🟢 fila       | 🟡 assign            | 🔴 património PP | 🔴          | 🟢         | 🟢→Admin       | 🟡              | 🟡                | 🟡 assign agentes        |
| Admin          | /app/admin              | Admin                | 🟢            | 🟡 users ops         | 🔴 como PP       | 🟢          | 🟢         | 🟢→Super       | 🟡              | 🟡 moderação      | 🟡 /admin/utilizadores   |
| Super          | /app/super              | Super+Admin          | 🟢            | 🟡                   | 🔴 cockpit PP    | 🟢          | 🟢         | 🟢→Founder     | 🟡              | 🟡                | 🟡 supervisão            |
| Founder        | /app/fundador           | Fundador+Super+Admin | 🟢            | promote              | 🔴 cockpit PP    | 🟢          | 🟢         | 🟢 topo        | 🟡              | 🟡                | 🟢 institutional promote |
| Co-Founder     | modo founder            | como Founder         | 🟢            | 🟡/🟢                | 🔴               | 🟢 adminish | 🟢         | 🟢             | 🟡              | 🟡                | 🟡 (Owner-only founders) |
| Auditor        | sem mode UI             | —                    | 🔵 DB         | 🔴                   | 🔴               | 🔴          | 🔴         | 🔴             | 🔴              | 🔴                | 🔴 UI                    |
| Board/Investor | —                       | —                    | 🔴/⚪         | 🔴                   | 🔴               | 🔴          | 🔴         | 🔴             | 🔴              | 🔴                | 🔴                       |
| KAI            | camada AI               | fila                 | 🟢 score      | —                    | —                | —           | —          | —              | —               | —                 | —                        |

## 5. Matriz Acção × Papel

| Acção                                                   | Cli | PP  | C+P | Ag  | Pr  | Sup | Adm | Super        | Found         |
| ------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- | ------------ | ------------- |
| Registar conta self-serve Cliente/PP                    | 🟢  | 🟢  | 🟢  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴           | 🔴            |
| Seleccionar experiência                                 | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢           | 🟢            |
| Explorar habitação                                      | 🟢  | 🔴* | 🟢  | 🟢  | 🔴  | 🟢  | 🟢  | 🟢           | 🟢            |
| Activar património próprio                              | 🔴  | 🟢  | 🟢  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴           | 🔴            |
| Submeter publicação                                     | 🔴  | 🟢  | 🟢  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴           | 🔴            |
| Gostar/Favoritar/Comentar/Perguntar/Partilhar/Denunciar | 🟢  | 🟢  | 🟢  | 🟢  | 🔴  | 🟢  | 🟢  | 🟢           | 🟢            |
| Pedir visita                                            | 🟢  | 🟡  | 🟢  | 🟡  | 🔴  | 🟡  | 🟡  | 🟡           | 🟡            |
| Celebrar contrato (UI contratos)                        | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢           | 🟢            |
| Inbox prestador fluxo Pedido→Avaliação                  | 🔴  | 🔴  | 🔴  | 🔴  | 🟡  | 🔴  | 🔴  | 🔴           | 🔴            |
| Ver fila publicação                                     | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢  | 🟢           | 🟢            |
| pending / request_docs / visit / corrections            | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢  | 🟢           | 🟢            |
| approve publicação                                      | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢           | 🟢            |
| reject publicação                                       | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢           | 🟢            |
| assign publication review                               | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢  | 🟢           | 🟢            |
| Criar escalação operacional                             | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢  | 🟢           | 🟢            |
| Ack/resolve escalação                                   | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢  | 🟢           | 🟢            |
| Abrir Super Command                                     | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢           | 🟢            |
| Founder Center tabs                                     | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟡 atalho    | 🟢            |
| Bootstrap claim Owner                                   | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔵 se aberto | 🟢 conta real |
| founder_promote_user                                    | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴           | 🟢 Owner      |
| Alterar comissão 35% UI                                 | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴           | 🔴            |
| Alterar comissão via RPC                                | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴           | 🟢            |
| Feature flags UI                                        | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟡           | 🟢            |
| KOCC                                                    | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢           | 🟢            |
| Revisão confiança `/app/confianca/revisao`              | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢  | 🟢           | 🟢            |
| Moderação panel completo                                | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🟢  | 🟢           | 🟢            |
| Chat list                                               | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢           | 🟢            |
| Chat start_direct sem pairing                           | 🟡  | 🟡  | 🟡  | 🟡  | 🟡  | 🟡  | 🟡  | 🟡           | 🟡            |
| Ledger / Pay real completo                              | 🟡  | 🟡  | 🟡  | 🟡  | 🟡  | 🟡  | 🟡  | 🟡           | 🟡            |
| Board dashboard                                         | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴  | 🔴           | 🔴            |

\* PP puro sem `housing.explore` no lens não explora; C+P e ops com housing.explore sim.

## 6. Mapa de escalação

```
[Supervisor] --escalation.create--> [Administrador]
       |                                   |
       +---- pode alvo directo ----------+--> [Superadministrador] --> [Founder]
Statuses (targetsForMode)

Estados: open -> acknowledged -> resolved | cancelled
Audit: escalation.create | acknowledged | resolved
UI: EscalationPanel em /app/admin#escalacoes e Founder tab Escalações
Gate: properties.review (ou founder) — Cliente/Agente/PP bloqueados no smoke
```

## 7. Mapa de promoção

```
Self-serve onboarding: client, patrimonial_partner
Ops assign (Admin utilizadores / processos): certified_agent (operacional)
Institutional RPC founder_promote_user (motivo obrigatório, sem demo):
  Owner -> founder | co_founder | super_administrator | administrator | supervisor | auditor
  Só Owner promove founders
Bootstrap único: founder_bootstrap_claim -> primeiro Owner (fecha mecanismo)
```

| De → Para                      | Mecanismo              | Estado                      |
| ------------------------------ | ---------------------- | --------------------------- |
| Visitante → Cliente/PP         | onboarding papeis      | 🟢                          |
| Conta → Agente                 | atribuição ops / roles | 🟢/🟡 UI                    |
| Conta → Prestador              | role service_provider  | 🟢 demo validada            |
| Conta → Supervisor/Admin/Super | founder_promote_user   | 🟢                          |
| Conta → Co-Founder             | promote co_founder     | 🟢                          |
| Conta → Owner                  | bootstrap claim        | 🔵 aberto no snap; demos 🔴 |
| Conta → Auditor                | promote auditor        | 🔵 DB / 🔴 UI mode          |
| Qualquer → Board/Investor UI   | —                      | ⚪/🔴                       |

## 8. Decisões de publicação × papel

| Decisão                 | Supervisor | Admin | Super | Founder | Outros |
| ----------------------- | ---------- | ----- | ----- | ------- | ------ |
| approve                 | 🔴         | 🟢    | 🟢    | 🟢      | 🔴     |
| reject                  | 🔴         | 🟢    | 🟢    | 🟢      | 🔴     |
| pending                 | 🟢         | 🟢    | 🟢    | 🟢      | 🔴     |
| request_corrections     | 🟢         | 🟢    | 🟢    | 🟢      | 🔴     |
| request_documents       | 🟢         | 🟢    | 🟢    | 🟢      | 🔴     |
| request_technical_visit | 🟢         | 🟢    | 🟢    | 🟢      | 🔴     |
| assign                  | 🟢         | 🟢    | 🟢    | 🟢      | 🔴     |

Efeito approve validado: `lifecycle_status = janela_premium` (pós-deploy).

## 9. Menus por experiência (inventário nav.ts)

- **`client`:** home, mensagens, explorar, residencia, favoritos, visitas, futuro, propostas, contratos, confianca, centroConfianca, centroSegurança, financeiro, mudanca, encontrar, concierge, garantia, assistencia, servicos, conta
- **`patrimonial_partner`:** home, mensagens, patrimonios, ativar, relatorios, contratos, confianca, centros, financeiro, garantia, servicos, planos, conta
- **`client_partner`:** união cliente+parceiro (explorar… + patrimonios/ativar/planos)
- **`certified_agent`:** home, mensagens, explorar, futuro, contratos, confianca, centros, agente, financeiro, concierge, assistencia, servicos, conta
- **`service_provider`:** home, mensagens, contratos, centros, financeiro, servicosPrestador, conta
- **`supervisor`:** home, mensagens, contratos, confianca, centros, agente, admin, financeiro, servicos, escalacoes, conta (+ concierge/assistencia conforme items)
- **`administrator`:** como supervisor + finance.read no lens; sem item super (falta finance.manage)
- **`super_administrator`:** admin + super + centros + agente + financeiro + escalacoes + …
- **`founder`:** fundador + super + admin + escalacoes + geral alargado

## 10. Comissão 35%

- Tabela `platform_commission_params` (seed SQL 0036).
- RPC `founder_set_commission_param` — Founder-only.
- Select autenticado possível; insert/update/delete revogados a authenticated excepto via RPC.
- Frontend: **nenhuma UI** de edição de comissão 🔴.
- Documentar a ops: alterar só via RPC/DB com conta Founder — nunca pedir ecrã inexistente.

## 11. Backlog de ausências (honestidade)

| Item                                  | Estado        | Notas                    |
| ------------------------------------- | ------------- | ------------------------ |
| Board ExperienceMode / dashboard      | ⚪/🔴         | Fora Beta 1.6            |
| Investor cockpit                      | ⚪/🔴         | Idem                     |
| Auditor ExperienceMode                | 🔴 UI / 🔵 DB | Promote target existe    |
| UI comissão 35%                       | 🔴            | RPC only                 |
| Founder financeiro profundo no Center | ⚪            | Link Super only          |
| Chat start_direct sem pairing         | 🟡            | List OK                  |
| Prestador Pedido→Pagamento E2E        | 🟡            | UI fluxo mínimo          |
| Auto-escalação SLA contínua           | ⚪            | Adiado SPRINT_BETA_1_6   |
| Exclusividade premium por produto     | ⚪            | Adiado                   |
| Pesquisa global topbar                | ⚪            | Adiado                   |
| Medalhas                              | ⚪            | Adiado                   |
| Gestão pós-remodelação completa       | ⚪            | Adiado                   |
| Rede prestadores Valor+ completa      | 🔴/⚪         |                          |
| Motor ICK A–G automático completo     | 🟡            | Simplificado             |
| Owner real claimado em produção       | 🔵            | Bootstrap aberto no snap |

## 12. Matriz lifecycle — quem muda estado

| Estado / transição                     | Actor típico                     |
| -------------------------------------- | -------------------------------- |
| rascunho                               | PP                               |
| submetido                              | PP                               |
| em_analise_kai / em_analise_admin      | sistema / fila                   |
| pendente / correcoes / docs / inspecao | Supervisor/Adminish via decisões |
| janela_premium                         | Adminish approve + trigger       |
| publicado                              | promote janela / tempo           |
| reservado/contrato/arrendado/…         | contratos/triggers 🟡            |
| arquivado                              | reject                           |

## 13. Matriz confiança

| Capacidade                       | Cliente | PP  | Agente | Prestador | Supervisor | Admin+ |
| -------------------------------- | ------- | --- | ------ | --------- | ---------- | ------ |
| Centro Confiança próprio         | 🟢      | 🟢  | 🟢     | 🟢        | 🟢         | 🟢     |
| Submeter docs                    | 🟢      | 🟢  | 🟢     | 🟢        | 🟢         | 🟢     |
| Revisão `/app/confianca/revisao` | 🔴      | 🔴  | 🔴     | 🔴        | 🟢         | 🟢     |
| Ver KYC/UTS/ICK no menu          | 🟢      | 🟢  | 🟢     | 🟢        | 🟢         | 🟢     |

## 14. Matriz financeira

| Capacidade          | Campo | Supervisor | Admin | Super | Founder |
| ------------------- | ----- | ---------- | ----- | ----- | ------- |
| `/app/financeiro`   | 🟡    | 🟡         | 🟡    | 🟡    | 🟡      |
| Super Ledger/Pay    | 🔴    | 🔴         | 🔴    | 🟡    | 🟡      |
| finance.read lens   | —     | —          | 🟢    | 🟢    | 🟢      |
| finance.manage lens | —     | —          | —     | 🟢    | 🟢      |
| Comissão RPC        | 🔴    | 🔴         | 🔴    | 🔴    | 🟢      |
| Comissão UI         | 🔴    | 🔴         | 🔴    | 🔴    | 🔴      |

## 15. Diagrama governação completo

```
                    [Founder/Owner]
                     /    |     \
            promote /  flags \  escalation topo
                   /      |     \
          [Co-Founder] [Super] [KOCC/Audit]
                         |
                      [Admin]
                         |
                   [Supervisor]
                    /    |    \
              [Agente] [PP] [Prestador]
                         \
                      [Cliente]

        lateral: KAI (score)
        fora: Auditor(DB) · Board · Investor
```

## 16. Checklists de governação (ops)

### 16.1 Antes de promover

- Confirmar user_id real
- Confirmar não é demo.*
- Motivo escrito
- Papel alvo correcto
- Rever audit após promote

### 16.2 Antes de approve

- ID PP
- Docs
- Fotos fachada/rua/>=5
- GPS
- Consistência
- KAI issues tratados ou aceites
- Notas se necessário

### 16.3 Antes de pending

- Escolher codes oficiais
- Solução clara para o PP
- Assign owner do processo
- SLA / escalação se bloqueado

## 17. Fontes de verdade (obrigatório)

- `apps/web/modules/shell/role-experience.ts` — ExperienceMode, MODE_LENS, homes, path rules
- `apps/web/modules/shell/role-operating-matrix.ts` — missões, mustDo/mustNot, CTAs, cockpitHint
- `apps/web/modules/shell/nav.ts` — SHELL_NAV_ITEMS
- `apps/web/modules/administracao/services/publication-review-client.ts` — decisões
- `apps/web/modules/administracao/components/EscalationPanel.tsx` — cadeia
- `apps/web/modules/kocc/components/FounderCenterClient.tsx` — tabs
- `apps/web/modules/kocc/services/institutional-client.ts` — claim/promote
- `packages/types/src/index.ts` — PermissionCode base
- SQL `0036_trust_governance_gate.sql` — reasons, commission, review
- SQL `0037_four_pillars_governance.sql` — audit/moderation pillars
- SQL `0038_lifecycle_social_founder_ops.sql` — lifecycle, social, founder ops
- SQL `0039_ops_roles_visual_gate.sql` — supervisor gate approve/reject
- SQL `0040_ops_matrix_experiences.sql` — matrix experiences
- `docs/product/ROLE_OPERATING_VALIDATION_POST_DEPLOY.md`
- `docs/product/SPRINT_BETA_1_6.md`
- `docs/product/MANUAL_PLATFORM_AUDIT_SNAP_2026-08-09.md`
- `docs/help/MANUAL_UTILIZADOR_COMPLETO_v2.md`
- `docs/help/MANUAL_OPERACIONAL_ADMINISTRATIVO_v2.md`

Fim da Matriz de Papéis, Permissões e Governação v2.

## 18. Detalhe MODE_LENS por experiência (narrativa)

### 18.1 `client`

Permissões no lens: `platform.access`, `housing.explore`, `contracts.manage`, `reputation.manage`, `trust.manage`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

### 18.2 `patrimonial_partner`

Permissões no lens: `platform.access`, `properties.manage`, `contracts.manage`, `trust.manage`, `reputation.manage`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

### 18.3 `client_partner`

Permissões no lens: `platform.access`, `housing.explore`, `properties.manage`, `contracts.manage`, `trust.manage`, `reputation.manage`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

### 18.4 `certified_agent`

Permissões no lens: `platform.access`, `agent.operate`, `housing.explore`, `contracts.manage`, `reputation.manage`, `trust.manage`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

### 18.5 `service_provider`

Permissões no lens: `platform.access`, `services.operate`, `contracts.manage`, `trust.manage`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

### 18.6 `supervisor`

Permissões no lens: `platform.access`, `admin.panel`, `properties.review`, `audit.read`, `moderation.manage`, `housing.explore`, `trust.manage`, `contracts.manage`, `agent.operate`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

### 18.7 `administrator`

Permissões no lens: `platform.access`, `admin.panel`, `properties.review`, `audit.read`, `moderation.manage`, `trust.manage`, `contracts.manage`, `housing.explore`, `agent.operate`, `reputation.manage`, `finance.read`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

### 18.8 `super_administrator`

Permissões no lens: `platform.access`, `admin.panel`, `properties.review`, `audit.read`, `moderation.manage`, `executive.panel`, `trust.manage`, `contracts.manage`, `housing.explore`, `agent.operate`, `reputation.manage`, `finance.manage`, `finance.read`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

### 18.9 `founder`

Permissões no lens: `platform.access`, `admin.panel`, `properties.review`, `audit.read`, `moderation.manage`, `executive.panel`, `founder.manage`, `trust.manage`, `contracts.manage`, `housing.explore`, `agent.operate`, `reputation.manage`, `finance.manage`, `finance.read`

A UI só mostra acções se a sessão real também tiver o código. Sem intersecção ⇒ item oculto / ForbiddenPanel.

## 19. Matriz de rotas autenticadas (existência)

| Rota                      | Cliente       | PP   | Agente | Prestador   | Supervisor | Admin | Super | Founder   |
| ------------------------- | ------------- | ---- | ------ | ----------- | ---------- | ----- | ----- | --------- |
| `/app`                    | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/habitacao/explorar` | 🟢            | —/🔴 | 🟢     | —           | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/patrimonios`        | 🔴            | 🟢   | 🔴     | 🔴          | 🔴         | 🔴*   | 🔴*   | 🔴*       |
| `/app/patrimonios/novo`   | 🔴            | 🟢   | 🔴     | 🔴          | 🔴         | 🔴*   | 🔴*   | 🔴*       |
| `/app/parceiro/planos`    | 🔴            | 🟢   | 🔴     | 🔴          | 🔴         | 🔴    | 🔴    | 🔴        |
| `/app/agente`             | 🔴            | 🔴   | 🟢     | 🔴          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/servicos`           | 🟢            | 🟢   | 🟢     | 🟢 provider | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/admin`              | 🔴            | 🔴   | 🔴     | 🔴          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/admin/utilizadores` | 🔴            | 🔴   | 🔴     | 🔴          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/admin#escalacoes`   | 🔴            | 🔴   | 🔴     | 🔴          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/super`              | 🔴            | 🔴   | 🔴     | 🔴          | 🔴         | 🔴    | 🟢    | 🟢        |
| `/app/fundador`           | 🔵 onboarding | 🔵   | 🔵     | 🔵          | 🔵         | 🔵    | 🔵    | 🟢 center |
| `/app/confianca/revisao`  | 🔴            | 🔴   | 🔴     | 🔴          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/mensagens`          | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/centro-confianca`   | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/centro-seguranca`   | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/financeiro`         | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/contratos`          | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/perfil`             | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/app/ajuda`              | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |
| `/documentacao`           | 🟢            | 🟢   | 🟢     | 🟢          | 🟢         | 🟢    | 🟢    | 🟢        |

\* Lens mitiga; perms DB podem ainda incluir `properties.manage` em Super/Admin (nota pós-deploy).

## 20. Matriz de eventos de auditoria (amostra)

| Evento                                  | Quem dispara                 | Onde ver                                  |
| --------------------------------------- | ---------------------------- | ----------------------------------------- |
| publication.assign                      | Supervisor/Adminish          | AuditCenter                               |
| decisão publicação (approve/pending/…)  | Adminish/Supervisor conforme | AuditCenter                               |
| escalation.create                       | ops com review               | AuditCenter                               |
| escalation acknowledged/resolved        | alvo/responsável             | AuditCenter                               |
| institutional.promote                   | Owner/Founder                | AuditCenter                               |
| founder bootstrap claim                 | conta real                   | audit institucional                       |
| social like/favorite/comment/ask/report | utilizadores ficha           | persistência social + moderação se report |

## 21. Regras de ouro da governação

1. Nunca documentar ecrã que não exista no código.
2. Supervisor nunca aprova/rejeita — mesmo que a UI mostre botão, o RPC bloqueia.
3. Comissão 35% não tem frontend — Founder RPC/DB.
4. Demos não governam produção.
5. Experiência UI não escala permissões reais.
6. KAI informa; humanos decidem.
7. Board/Investor/Auditor sem mode UI nesta versão.
8. Em dúvida: validar `ROLE_OPERATING_VALIDATION_POST_DEPLOY.md` + SQL.

## 22. Índice cruzado com manuais

| Tema                               | Manual utilizador | Manual ops | Esta matriz |
| ---------------------------------- | ----------------- | ---------- | ----------- |
| Fichas Cliente/PP/Agente/Prestador | §§5–8             | —          | §§4–5       |
| Fichas Supervisor–Founder          | —                 | §§5–8      | §§4–5       |
| Pendência / Approve                | §17               | §§13–14    | §8          |
| Escalações                         | nota              | §15        | §6          |
| Promote / bootstrap                | —                 | §§9–11     | §7          |
| MODE_LENS                          | §3                | —          | §§2,18      |
| Comissão                           | §16               | §17        | §10         |
| Backlog                            | várias 🟡         | várias     | §11         |

Fim alargado da matriz v2.
