# KUTEKA — MANUAL OPERACIONAL E ADMINISTRATIVO

**Versão:** 2.0 · **Data:** 2026-08-09 · **Idioma:** Português europeu (PT-AO de plataforma)

**Produção:** https://kutekalink.com · **Ajuda:** `/app/ajuda`

**Auditoria:** `docs/product/MANUAL_PLATFORM_AUDIT_SNAP_2026-08-09.md`

**Destinatários:** Supervisor · Administrador · Superadministrador · Founder/Owner (+ notas Co-Founder)

Utilizadores Cliente/PP/Agente/Prestador: ver `MANUAL_UTILIZADOR_COMPLETO_v2.md`.

Baseado em código + migrações `0036`–`0040` + validação pós-deploy 2026-08-09. Não inventa ecrãs.

## 1. Legenda de estado

| Símbolo | Significado |
|---------|-------------|
| 🟢 IMPLEMENTADO | Código + validação pós-deploy |
| 🟡 PARCIAL | UI/RPC incompletos ou demo |
| 🔵 PREPARADO | Infra pronta; claim/uso real limitado |
| 🟠 EM BETA | Beta com restrições |
| 🔴 NÃO IMPLEMENTADO | Sem fluxo utilizável |
| ⚪ PLANEADO v1.1+ | Backlog pós-Beta 2 |

## 2. Hierarquia operacional

```
Founder / Owner  (+ Co-Founder usa modo founder)
        |
Superadministrador     <- autoridade máxima da operação diaria
        |
Administrador          <- approve / reject / pendenciar / moderar
        |
Supervisor             <- analisa / pendencia / docs / visita / atribui / escala
        |                 NÃO approve/reject (SQL 0039)
   +----+----+
Agente   PP   Prestador
        |
     Cliente

KAI: camada AI transversal (score preliminar na fila) — não e humano
Board / Investor / Auditor: fora da cadeia ops UI (Auditor so perms DB)
```

Cadeia de escalação formal: Supervisor → Administrador → Superadministrador → Founder 🟢

## 3. Entrar e seleccionar experiência ops 🟢

- Login `/auth/entrar` com conta que tenha o papel DB correspondente (não self-serve).
- Demos validadas no pós-deploy: demo.supervisor / demo.admin / demo.super (e demos de papeis de campo).
- Menu da conta → experiência: Supervisor | Administrador | Superadministrador | Founder / Owner.
- Default da UI prefere modos institucionais quando a conta os tem (`defaultExperience`).
- Homes: Supervisor/Admin → `/app/admin`; Super → `/app/super`; Founder → `/app/fundador`.
- `/app/fundador` e acessivel a qualquer sessao autenticada para bootstrap (sem PATH_RULE).

## 4. Menus reais por experiência ops (`nav.ts`)

### 4.1 Supervisor

- Geral: Inicio, Mensagens, Contratos, Confiança, Centros, Financeiro, Concierge/Assistencia/Serviços conforme lista, Conta.
- Agente: Area do Agente (tem `agent.operate` no lens).
- Admin: Central `/app/admin`, Escalações `/app/admin#escalacoes`.
- Nao: Super (`finance.manage`), Fundador (experiências founder only), Activar património.

### 4.2 Administrador

- Como Supervisor + moderacao completa na Central; CTAs utilizadores/contratos/confiança.
- Lens inclui `finance.read` (não `finance.manage` → sem item Super por `requiresPermission`).

### 4.3 Superadministrador

- Admin + Super `/app/super` (requer `finance.manage` efectivo).
- CTAs: Super, Central, KOCC `?tab=kocc`, Fundador (atalho), Centro de Segurança.

### 4.4 Founder

- Item Fundador `/app/fundador`; Super; Admin; Escalações; Centros; etc.
- Founder Center tabs internas (não sao items nav separados): Empresa, Pessoas, Operação, Financeiro, Segurança, KOCC, Auditoria, Feature Flags, Escalações.

## 5. Ficha completa — SUPERVISOR 🟢

*Fonte: role-operating-matrix.ts + nav + SQL + pós-deploy.*

### 5.1 Missão oficial

Executar e supervisionar o trabalho operacional diário.

### 5.2 Reporta a

Administrador.

### 5.3 Home e CTAs

Home `/app/admin` (titulo UI: Cockpit do Supervisor). CTAs: Central, Escalações, Revisão Confiança, Utilizadores/Agentes, Mensagens.

### 5.4 Menu / superfícies

Central de Trabalho + PublicationReviewQueue + EscalationPanel `#escalacoes` + AuditCenter; sem ModerationCenterPanel completo (Admin ve moderacao extra).

### 5.5 Pode fazer (mustDo)

- Analisar patrimónios em fila.
- Pendenciar e pedir documentos/visita/correcoes.
- Contactar Parceiro e atribuir tarefas/reviews.
- Acompanhar SLA e escalar para Admin.

### 5.6 Não deve / gates (mustNot)

- Aprovar ou rejeitar definitivamente (SQL: `administrator required for approve/reject`).
- Alterar comissões.
- Criar Super Admins.
- Alterar configurações críticas / feature flags Founder.

### 5.7 Decisões de publicacao

Permitidas: `pending`, `request_corrections`, `request_technical_visit`, `request_documents` (+ contacto PP / assign). Proibidas: `approve`, `reject`.

### 5.8 Utilizadores e atribuição

`/app/admin/utilizadores` para atribuir agentes; `admin_assign_publication_review` para se auto-atribuir a um review.

### 5.9 Confiança / moderacao

Revisão `/app/confianca/revisao`; lens inclui `moderation.manage` / `trust.manage` / `audit.read`.

### 5.10 Escalações

Cria escalacao tipicamente para `administrator` (pode escolher Super/Founder). Resolve/assume conforme RPC.

### 5.11 Comúnicacao

Mensagens 🟡 pairing; botao Contactar PP na Central.

### 5.12 Financeiro

`/app/financeiro` superfície; sem Super Command.

### 5.13 Auditoria

Ve AuditCenterPanel na Central.

### 5.14 KAI na fila

Cada item da fila pode mostrar `kai_preliminary` (score/issues/suggestions) — apoio, não decisao automatica.

### 5.15 Rotas-chave

`/app/admin`, `/app/admin#escalacoes`, `/app/admin/utilizadores`, `/app/confianca/revisao`, `/app/mensagens`, `/app/agente`, `/app/contratos`.

### 5.16 Fluxo do dia

Central de Trabalho → SLA → Contactar PP → Atribuir Agente → Escalações

### 5.17 Limitacoes honestas

Não consegue fechar fila sozinho se o caso exige approve/reject — deve escalar.

### 5.18 Checklist primeiro dia

- Entrar como Supervisor e abrir `/app/admin`.
- Rever fila PublicationReviewQueue + scores KAI.
- Atribuir um processo a si.
- Aplicar pending/docs/visita/correcoes com motivo real.
- Contactar PP.
- Criar escalacao se bloqueado para approve.

### 5.19 Erros frequentes

- Clicar Aprovar → erro `administrator required for approve/reject`.
- Pendencia sem motivo/notas → `pending requires at least one reason code` (ou notas >=3 chars conforme regra SQL).

## 6. Ficha completa — ADMINISTRADOR 🟢

*Fonte: role-operating-matrix.ts + nav + SQL + pós-deploy.*

### 6.1 Missão oficial

Gerir os processos operacionais da Kuteka.

### 6.2 Reporta a

Super Administrador.

### 6.3 Home e CTAs

`/app/admin` Central de Trabalho. CTAs: Central, Utilizadores/Moderacao, Revisão Confiança, Contratos.

### 6.4 Menu / superfícies

Fila + Escalações + Auditoria + Moderacao + stats + KosAnalytics.

### 6.5 Pode fazer (mustDo)

- Aprovar / rejeitar / pendenciar publicacoes.
- Atribuir Agentes e acompanhar contratos.
- Gerir moderacao e KYC.
- Contactar Parceiros.

### 6.6 Não deve / gates (mustNot)

- Alterar propriedade institucional do Founder.
- Alterar comissões sem Super/Founder (RPC Founder-only).
- Activar património como se fosse Parceiro no cockpit Admin.

### 6.7 Decisões de publicacao

Todas as decisões: approve | pending | reject | request_corrections | request_technical_visit | request_documents.

### 6.8 Utilizadores e atribuição

Utilizadores em `/app/admin/utilizadores`; não promove Founders (isso e Founder Center).

### 6.9 Confiança / moderacao

ModerationCenterPanel + `/app/confianca/revisao`.

### 6.10 Escalações

Recebe escalacoes do Supervisor; pode re-escalar a Super/Founder; acknowledge/resolve 🟢.

### 6.11 Comúnicacao

Mensagens + Contactar PP.

### 6.12 Financeiro

`finance.read` no lens; financeiro profundo no Super.

### 6.13 Auditoria

AuditCenterPanel + eventos de decisao/assign/escalacao.

### 6.14 KAI na fila

Usa KAI preliminar como apoio na fila.

### 6.15 Rotas-chave

`/app/admin`, utilizadores, confiança/revisão, contratos, mensagens, agente.

### 6.16 Fluxo do dia

Central de Trabalho — fila, não dashboard de estatisticas (missão).

### 6.17 Limitacoes honestas

Pode approve; validar sempre motivos e notas. Pos-approve: janela_premium.

### 6.18 Checklist primeiro dia

- Abrir Central e fila.
- Tratar 1 pending e 1 approve em ambiente controlado.
- Rever auditoria do acto.
- Rever moderacao / KYC pendente.
- Responder escalacao de Supervisor.

### 6.19 Erros frequentes

- Approve sem ser adminish → so se papel incorrecto.
- RLS: não editar património alheio como PP.

## 7. Ficha completa — SUPERADMINISTRADOR 🟢

*Fonte: role-operating-matrix.ts + nav + SQL + pós-deploy.*

### 7.1 Missão oficial

Autoridade máxima da operação diaria, abaixo do Founder.

### 7.2 Reporta a

Founder / Owner.

### 7.3 Home e CTAs

Home `/app/super`. CTAs: Super, Central, KOCC, Founder Center, Centro de Segurança.

### 7.4 Menu / superfícies

Super Command Center (tabs incl. kocc etc.) + acesso Admin + atalho Fundador.

### 7.5 Pode fazer (mustDo)

- Supervisionar Admins, Supervisores e Agentes.
- Gerir fila critica e moderacao.
- KOCC operacional, fraude, Ledger e KAI (superfícies Super).
- Consultar toda a operação.

### 7.6 Não deve / gates (mustNot)

- Activar património como Parceiro no cockpit principal.
- Usar a plataforma como Cliente no cockpit principal.
- Alterar propriedade institucional do Founder sem Owner.

### 7.7 Decisões de publicacao

Pode approve/reject (adminish). Preferir deixar fila rotineira ao Admin; intervir em crítico.

### 7.8 Utilizadores e atribuição

Supervisiona pessoas; promocao institucional Founder/Co-Founder/Super e no Founder Center (Owner).

### 7.9 Confiança / moderacao

Acesso confiança/moderacao/auditoria alargado; `executive.panel` + `finance.manage`.

### 7.10 Escalações

Recebe escalacoes de Admin; escala a Founder; resolve 🟢.

### 7.11 Comúnicacao

Mensagens ops 🟡.

### 7.12 Financeiro

Ledger/sandbox/receitas/Pay no Super 🟡 profundidade; dinheiro real parcial.

### 7.13 Auditoria

Auditoria global via paineis + Super.

### 7.14 KAI na fila

KAI visivel na operação/fila.

### 7.15 Rotas-chave

`/app/super`, `/app/admin`, `/app/fundador` (atalho), `/app/centro-seguranca`, `/app/super?tab=kocc`.

### 7.16 Fluxo do dia

Super / KOCC → Central de Trabalho → Pessoas → Segurança → Auditoria

### 7.17 Limitacoes honestas

Sem Founder role: ve guia bootstrap em `/app/fundador` se bootstrap aberto — não e Owner ate claim conta real.

### 7.18 Checklist primeiro dia

- Abrir `/app/super` e KOCC.
- Rever Central critica.
- Rever escalacoes.
- Validar financeiro superfície.
- Não usar demo.* para governação.

### 7.19 Erros frequentes

- Esperar menus Founder sem papel founder → so onboarding.
- Comissão: sem UI — não procurar ecrã de 35%.

## 8. Ficha completa — FOUNDER / OWNER 🟢 UI · 🔵/🟡 claim real em producao no snap

*Fonte: role-operating-matrix.ts + nav + SQL + pós-deploy.*

### 8.1 Missão oficial

Proprietario e autoridade máxima da Kuteka — governação institucional.

### 8.2 Reporta a

— (topo da hierarquia).

### 8.3 Home e CTAs

Home `/app/fundador` Founder Center. CTAs: Fundador, Super, Central, KOCC, Segurança.

### 8.4 Menu / superfícies

Tabs: Empresa, Pessoas, Operação, Financeiro, Segurança, KOCC, Auditoria, Feature Flags, Escalações.

### 8.5 Pode fazer (mustDo)

- Gerir Founders / Co-Founders / Super Admins (e papeis institucionais via promote).
- Feature Flags, KOCC e configurações críticas.
- Métricas executivas e auditoria global.
- Supervisionar operação e segurança.

### 8.6 Não deve / gates (mustNot)

- Operar como Parceiro Activando património no cockpit Founder.
- Usar contas demo.* para governação de producao (bloqueadas no claim).

### 8.7 Decisões de publicacao

Adminish: pode approve/reject. Preferir Super/Admin para fila diaria; Founder no topo de escalacao.

### 8.8 Utilizadores e atribuição

Gestão Institucional (tab Pessoas): `founder_promote_user` com motivo obrigatório; demos rejeitadas.

### 8.9 Confiança / moderacao

Segurança + flags + auditoria + KOCC no Center.

### 8.10 Escalações

Topo da cadeia; resolve escalacoes críticas.

### 8.11 Comúnicacao

Institucional; Mensagens disponiveis.

### 8.12 Financeiro

Tab Financeiro e superfície com link ao Super — financeiro profundo ⚪/🟡 v1.1+. Comissão 35% via `founder_set_commission_param` (RPC/DB) 🔴 UI.

### 8.13 Auditoria

Tab Auditoria = AuditCenterPanel.

### 8.14 KAI na fila

KAI na operação; Founder não e substituto do KAI.

### 8.15 Rotas-chave

`/app/fundador`, `/app/super`, `/app/admin`, `/app/centro-seguranca`, `/app/admin#escalacoes`.

### 8.16 Fluxo do dia

Empresa → Pessoas → Operação → Financeiro → Segurança → KOCC → Auditoria

### 8.17 Limitacoes honestas

Snap 2026-08-09: bootstrap aberto; Owner real ainda não claimou; demos bloqueadas correctamente.

### 8.18 Checklist primeiro dia

- Conta real (não demo.*) autenticada.
- Se bootstrap aberto: claim Owner (secção 9).
- Seleccionar experiência Founder.
- Percorrer todas as tabs do Center.
- Promover Super/Admin/Supervisor com motivo.
- Rever flags, KOCC, auditoria, escalacoes.

### 8.19 Erros frequentes

- demo.* claim → `system demo accounts cannot become Founder`.
- Segundo claim automatico → impossivel (bootstrap fecha).

## 9. Founder bootstrap — tutorial profundo 🟢/🔵

### 9.1 O que e

Mecanismo unico `founder_bootstrap_claim` para o primeiro Owner. UI: `FounderOnboardingClient` em `/app/fundador` quando `bootstrapOpen` e a conta ainda não e Founder.

### 9.2 Pode fazer

- Qualquer conta autenticada não-demo pode tentar o claim enquanto bootstrap estiver aberto.
- Grava `user_id` em `founders` com `is_founder` e `is_owner`.
- Fecha o bootstrap permanentemente apos sucesso.

### 9.3 Como

- Criar conta real (não `demo.*@kuteka.local`).
- Entrar e abrir `/app/fundador`.
- Confirmar email / user_id mostrados.
- Clicar **Assumir como Founder / Owner**.
- Recarregar sessao (sair/entrar) se menus não actualizaram.
- Seleccionar experiência Founder / Owner.

### 9.4 Consequencia

- Conta torna-se Owner institucional; identidade permanente = `user_id` (email pode mudar depois no Centro de Segurança).
- Bootstrap fecha — sem segunda oportunidade automatica.
- Novos Co-Founders/Super/Admin/Supervisor criam-se em Pessoas (promote), não por novo bootstrap.

### 9.5 Auditoria

Eventos institucionais de claim/promote ficam no sistema de auditoria (`institutional.promote`, bootstrap). Rever tab Auditoria / paineis de audit.

### 9.6 Co-Founder

Owner em Gestão Institucional promove utilizador real a `co_founder` com motivo (>=3 chars). UI de experiência: modo `founder`. Demos rejeitadas. Co-Founder não substitui Owner automaticamente.

```
MODELO DE INTERFACE — exemplo conceptual
+------------------------------------------------------+
| Founder / Owner — Bootstrap                          |
| user_id: ********-****-****-****-************        |
| Bootstrap: ABERTO                                    |
|------------------------------------------------------|
| 1. Conta real autenticada                            |
| 2. Confirmar identidade                              |
| 3. [ Assumir como Founder / Owner ]                  |
| (Contas demo.* bloqueadas)                           |
+------------------------------------------------------+
```

## 10. Founder Center — cada tab em profundidade

Fonte UI: `FounderCenterClient` (`TabKey`: empresa, pessoas, operacao, financeiro, seguranca, kocc, auditoria, flags, escalacoes).

### 10.1 Empresa
- **O que é:** Identidade da sessão Founder (email, user_id, papéis, Owner).
- **Pode fazer:** Consultar o mapa de quem está autenticado e a orientação Empresa→…→Auditoria.
- **Como:** Abrir `/app/fundador` (tab default `empresa` ou `?tab=empresa`).
- **Consequência:** Sem escrita própria nesta tab — leitura via `get_institutional_identity`.
- **Auditoria:** Sem acto de escrita; identidade reflectida nos actos seguintes.

### 10.2 Pessoas
- **O que é:** Gestão Institucional (`InstitutionalCenterClient`).
- **Pode fazer:** Listar directório; promover `founder` / `co_founder` / `super_administrator` / `administrator` / `supervisor` / `auditor` com motivo; gerir cadeia institucional.
- **Como:** Tab Pessoas → `user_id` → papel alvo → motivo (>=3) → `founder_promote_user`. Demos rejeitadas; só Owner promove founders.
- **Consequência:** Altera `user_roles` / registos `founders` conforme o target.
- **Auditoria:** `institutional.promote` / `role_promoted`.

### 10.3 Operação
- **O que é:** Atalhos para a operação diária.
- **Pode fazer:** Abrir Central de Trabalho, Utilizadores/Agentes, Revisão de Confiança.
- **Como:** Links para `/app/admin`, `/app/admin/utilizadores`, `/app/confianca/revisao`.
- **Consequência:** Não decide sozinho aqui — encaminha para superfícies ops.
- **Auditoria:** Actos posteriores auditados no destino.

### 10.4 Financeiro
- **O que é:** Superfície financeira do Founder Center (aviso + ponte).
- **Pode fazer:** Abrir Super Command para receitas/Pay/Ledger.
- **Como:** Tab Financeiro → `/app/super`. Comissão 35% continua RPC `founder_set_commission_param` (sem UI).
- **Consequência:** Sem redesenho financeiro profundo nesta sprint (⚪ v1.1+).
- **Auditoria:** Alterações financeiras no Super/RPC.

### 10.5 Segurança
- **O que é:** Atalho ao Centro de Segurança.
- **Pode fazer:** Alterar email/telefone/sessões sem perder `user_id`.
- **Como:** `/app/centro-seguranca` (dupla confirmação de email).
- **Consequência:** Contactos novos; identidade institucional permanente.
- **Auditoria:** Eventos de segurança / mudança de contacto.

### 10.6 KOCC
- **O que é:** Centro KOCC (`KoccCenterClient`).
- **Pode fazer:** Operar/consultar KOCC se `canManage`.
- **Como:** Tab KOCC (paralelo a `/app/super?tab=kocc`).
- **Consequência:** Config/métricas KOCC conforme implementação actual.
- **Auditoria:** Actos KOCC quando aplicável.

### 10.7 Auditoria
- **O que é:** `AuditCenterPanel`.
- **Pode fazer:** Consultar trilha operacional/institucional (approve, escalation, promote, etc.).
- **Como:** Tab Auditoria → rever eventos.
- **Consequência:** Superfície de leitura/evidência.
- **Auditoria:** O próprio painel é a vista.

### 10.8 Feature Flags
- **O que é:** `FeatureFlagsPanel`.
- **Pode fazer:** Activar/desactivar flags se `canManage`.
- **Como:** Tab Feature Flags.
- **Consequência:** Altera comportamento de features gated.
- **Auditoria:** Alterações no subsistema de flags/audit.

### 10.9 Escalações
- **O que é:** `EscalationPanel` embutido.
- **Pode fazer:** Ver, criar (se aplicável), acknowledge e resolver no topo da cadeia.
- **Como:** Tab Escalações ou `/app/admin#escalacoes`.
- **Consequência:** Status open→acknowledged/resolved/cancelled; notifica cadeia Supervisor→Admin→Super→Founder.
- **Auditoria:** `escalation.create` / `acknowledged` / `resolved` 🟢.

```
MODELO DE INTERFACE — exemplo conceptual
+-------------------------------------------------------------------+
| Founder Center                                                    |
| [Empresa][Pessoas][Operação][Financeiro][Segurança]               |
| [KOCC][Auditoria][Feature Flags][Escalações]                      |
|-------------------------------------------------------------------|
| Conteudo da tab activa                                            |
| Atalhos: Super | Central | Centro de Segurança                    |
+-------------------------------------------------------------------+
```

## 11. Gestão de utilizadores — quem promove quem 🟢

RPC `founder_promote_user` (0038). Targets aceites: `founder`, `co_founder`, `super_administrator`, `administrator`, `supervisor`, `auditor`.

```
Owner (is_owner)
  ├─ promove founder / co_founder          (so Owner)
  ├─ promove super_administrator
  ├─ promove administrator
  ├─ promove supervisor
  └─ promove auditor                       (perms DB; sem ExperienceMode UI)

Regras:
  - Motivo obrigatório
  - Contas system demo NÃO podem ser promovidas
  - Co-Founder usa experiência founder
  - Admin de campo NÃO promove Super/Founder pela UI institucional
  - Agente/Prestador/Cliente/PP: atribuição operacional distinta
    (Admin utilizadores / onboarding self-serve) — não confundir com promote institucional
```

### 11.1 Matriz resumida

| Actor | Pode promover |
|-------|---------------|
| Owner | founder, co_founder, super_administrator, administrator, supervisor, auditor |
| Founder nao-Owner | conforme RPC/guards (founders: so Owner) |
| Super / Admin UI ops | gestão operacional de agentes/utilizadores em `/app/admin/utilizadores` — não e bootstrap Owner |
| Supervisor | atribui reviews/agentes; não promote institucional Founder |
| Demo.* | 🔴 claim/promote institucional |

## 12. Ciclo de vida do património e quem muda o estado

```
PP cria/edita rascunho
  -> submete (submetido)
  -> KAI / analise (em_analise_kai / em_analise_admin) 🟡 automacao KAI
  -> Supervisor/Admin: pending | correcoes | docs | visita
  -> Admin/Super/Founder: approve | reject
       approve: review approved + status active
                premium_visible_at=now
                general_visible_at=now+6h
                trigger sync -> lifecycle janela_premium 🟢 pós-deploy
       reject: arquivado
  -> promote_premium_window_properties: janela_premium -> publicado
  -> contrato/ocupacao: triggers 0038 avancam estados 🟡
```

### 12.1 Quem altera o que

| Accao | PP | Agente | Supervisor | Admin | Super | Founder |
|-------|----|--------|------------|-------|-------|---------|
| Criar/editar próprio | 🟢 | 🔴 | 🔴 | 🔴* | 🔴* | 🔴* |
| Submeter | 🟢 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| pending/docs/visita/correcoes | 🔴 | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 |
| approve/reject | 🔴 | 🔴 | 🔴 | 🟢 | 🟢 | 🟢 |
| assign review | 🔴 | 🔴 | 🟢 | 🟢 | 🟢 | 🟢 |

*Ops não devem activar património como PP no cockpit; perms DB podem ainda listar `properties.manage` em Super/Admin (desalinhamento notado no pós-deploy) — a lens UI B+C mitiga.

## 13. Tutorial completo — colocar em PENDENCIA 🟢

### 13.1 Quando usar

Quando o património não pode ser aprovado ainda, mas ha caminho de correcao. Decisao `pending` (ou variantes `request_*`).

### 13.2 Quem

Supervisor, Admin, Super, Founder (com `properties.review`).

### 13.3 Passos

- Abrir `/app/admin` → PublicationReviewQueue.
- Seleccionar item; rever KAI preliminar (score/issues).
- Opcional: Atribuir (`admin_assign_publication_review`).
- Escolher decisao: `pending` ou `request_corrections` / `request_documents` / `request_technical_visit`.
- Seleccionar pelo menos um motivo de `publication_pending_reasons` **ou** notas admin com >= 3 caracteres (regra SQL).
- Confirmar `admin_decide_property_publication`.
- Verificar notificacao ao PP e auditoria.

### 13.4 Motivos oficiais (code → label → solution)

| code | label_pt | solution_pt (resumo) |
|------|----------|----------------------|
| `partner_identity_unconfirmed` | Identidade do Parceiro Patrimonial não confirmada | Complete KIS/KYC no Centro de Confiança |
| `property_document_insufficient` | Documento do imóvel insuficiente | Carregue titulo/documento validado |
| `not_in_advertiser_name` | Imóvel não esta em nome do anunciante | Procuração / contrato social / autorização |
| `photos_insufficient` | Fotografias insuficientes | Pelo menos 5 fotos nítidas |
| `no_facade_photos` | Não existem fotografias da fachada | Fotos da fachada |
| `no_street_photos` | Não existem fotografias da rua | Fotos da rua/envolvente |
| `address_inconsistent` | Endereco inconsistente | Corrigir morada/bairro/municipio vs documento |
| `gps_invalid` | GPS invalido | Actualizar coordenadas no mapa |
| `contradictory_info` | Informacao contraditoria | Rever tipologia/areas/descricao |
| `fraud_suspicion` | Suspeita de fraude | Visita técnica + validação documental reforçada |
| `technical_visit_needed` | Visita técnica necessária | Visita de Agente Kuteka |
| `additional_docs` | Documentação adicional necessária | Enviar docs indicados na notificacao |

### 13.5 Efeitos no sistema

| Decisao | review_status | lifecycle_status (0039) | property status |
|---------|---------------|-------------------------|-----------------|
| pending | pending | em_analise_documental | draft |
| request_corrections | corrections_requested | em_preparacao | draft |
| request_documents | documents_requested | em_analise_documental | draft |
| request_technical_visit | technical_visit_requested | em_inspecao_técnica | draft |

Trigger 0038 pode alinhar `pending`→`pendente`, `corrections_requested`→`correcoes` quando sincroniza a partir do review — operar pela decisao RPC e validar o estado final no imóvel.

### 13.6 Wireframe pendencia

```
MODELO DE INTERFACE — exemplo conceptual
+----------------------------------------------------------+
| Fila de publicacao · item CODE-88                        |
| KAI score: 62 | issues: fotos, GPS                       |
|----------------------------------------------------------|
| Decisao: ( ) approve  (*) pending  ( ) reject            |
|          ( ) corrections ( ) documents ( ) technical visit|
| Motivos: [x] photos_insufficient [x] gps_invalid         |
| Notas admin: ________________________________           |
| [ Atribuir-me ] [ Contactar PP ] [ Confirmar ] [ Escalar]|
+----------------------------------------------------------+
```

## 14. Tutorial completo — APROVAR 🟢

### 14.1 Quem

Administrador, Superadministrador, Founder/Owner/Co-Founder (adminish). Supervisor **nao**.

### 14.2 Passos

- Garantir que docs/fotos/identidade PP estao aceitáveis (ou que pendencias foram sanadas).
- Abrir item na fila `/app/admin`.
- Rever KAI + ficha + histórico de motivos.
- Seleccionar `approve`.
- Confirmar RPC `admin_decide_property_publication`.
- Validar: `review_status=approved`, `properties.status=active`.
- Validar lifecycle: `janela_premium` (pós-deploy) enquanto `general_visible_at` no futuro (~6h).
- Apos janela: `publicado` via `promote_premium_window_properties` / tempo.
- Rever notificacao ao PP e audit.

### 14.3 Efeitos

- `premium_visible_at = now`
- `general_visible_at = now + 6 hours`
- Notificacao: publicacao aprovada + acesso prioritario premium ~6h
- Trigger pode forçar `janela_premium` quando general_visible_at > now

### 14.4 Rejeitar (contraste)

`reject` → review rejected, lifecycle `arquivado`, status draft. Exige motivos/notas. Irreversivel na pratica operacional corrente (republicar = novo ciclo).

```
MODELO DE INTERFACE — exemplo conceptual
+----------------------------------------------------------+
| Aprovar publicacao · CODE-88                             |
| Checklist humano: ID PP | docs | fotos | GPS | consist.  |
| Decisao: (*) approve                                     |
| [ Confirmar aprovacao ]                                  |
| Pos-condicao esperada: lifecycle = janela_premium        |
+----------------------------------------------------------+
```

## 15. Escalações 🟢

Componente `EscalationPanel`. Alvos: administrator | super_administrator | founder. Prioridades + dueHours. RPCs create/list/resolve.

```
Supervisor --cria--> Admin --ack/resolve ou re-escala--> Super --> Founder
Audit: escalation.create / acknowledged / resolved
UI: /app/admin#escalacoes  |  Founder Center tab Escalações
Cliente/PP/Agente: NÃO criam (properties.review required) — validado pós-deploy
```

### 15.1 Como criar

- Abrir painel Escalações (Central ou Founder).
- Motivo textual + prioridade + prazo (horas) + alvo.
- Opcional ligar propertyId/reviewId se o painel estiver no contexto do item.
- Confirmar; verificar lista e auditoria.

### 15.2 Como resolver

Responsavel: acknowledge → trabalhar → resolve (ou cancel). Notas de resolucao automaticas curtas na UI (`Assumida…` / `Resolvida…`).

## 16. Comúnicacao ops

- Contactar PP: botao na Central → `/app/mensagens` 🟡 pairing.
- Chat list OK; start_direct frequentemente bloqueado sem contrato/role pairing.
- Não usar escalacao formal para simples dúvida — escalacao e para bloqueio de processo/SLA.

## 17. Financeiro (ops) 🟡

- Superfícies: `/app/financeiro` (geral), `/app/super` (comando), Founder tab Financeiro → link Super.
- Ledger / sandbox / receitas: sobretudo Super.
- Kuteka Pay: parcial.
- Comissão plataforma 35%: tabela `platform_commission_params` + RPC `founder_set_commission_param` — **sem UI frontend**. So Founder via RPC/DB/service.
- Não abrir Board/Investor financeiro nesta versao ⚪.

## 18. Auditoria 🟢

- Painel `AuditCenterPanel` na Central (e Founder tab).
- Eventos relevantes: `publication.assign`, decisões de publicacao, `escalation.*`, `institutional.promote`, mudancas de flags.
- Permissão tipica: `audit.read` / admin.panel / finance.manage conforme politicas SQL.

## 19. Wireframes ops

```
MODELO DE INTERFACE — exemplo conceptual
FOUNDER CENTER — ver secção 10
```

```
MODELO DE INTERFACE — exemplo conceptual
SUPER — /app/super
+------------------------------------------------------+
| Centro de Comando Super                              |
| Tabs: ... | kocc | finanças | ...                    |
|------------------------------------------------------|
| Métricas / Ledger / KOCC / atalhos Admin             |
+------------------------------------------------------+
```

```
MODELO DE INTERFACE — exemplo conceptual
ADMIN — /app/admin
+------------------------------------------------------+
| Central de Trabalho                                  |
| [Revisão Confiança][Contactar PP][Escalações][Users] |
|------------------------------------------------------|
| KOS Analytics                                        |
| PublicationReviewQueue  <--- fila principal          |
| EscalationPanel                                      |
| AuditCenterPanel                                     |
| ModerationCenterPanel (Admin; não Supervisor)        |
| Stats                                                |
+------------------------------------------------------+
```

```
MODELO DE INTERFACE — exemplo conceptual
SUPERVISOR — mesmo /app/admin com copy Cockpit do Supervisor
+------------------------------------------------------+
| Cockpit do Supervisor                                |
| Fila | SLA | Contactar PP | Atribuir | Escalações    |
| SEM botoes efectivos de approve/reject (RPC bloqueia)|
+------------------------------------------------------+
```

```
MODELO DE INTERFACE — exemplo conceptual
CENTRAL TRABALHO + PENDENCIA + APROVACAO — ver wireframes 13.6 e 14.4
```

## 20. Matrizes de trabalho diário

### 20.1 Supervisor

| Bloco | Accao | Output |
|-------|-------|--------|
| Manhã | Abrir fila + SLA | Lista priorizada |
| Analise | KAI + ficha | Decisao pending/docs/visita/correcoes |
| Contacto | Mensagens PP | PP informado |
| Atribuição | Agente / self-assign | Owner do processo |
| Bloqueio | Escalacao Admin | Caso sobe |

### 20.2 Admin

| Bloco | Accao | Output |
|-------|-------|--------|
| Fila critica | approve/reject/pending | Estados lifecycle correctos |
| Escalações | ack/resolve/re-escalar | SLA fechado ou Super |
| KYC/Moderacao | rever | Contas/conteudo tratados |
| Agentes | atribuir | Cobertura terreno |

### 20.3 Super

| Bloco | Accao | Output |
|-------|-------|--------|
| KOCC | rever saude ops | Alertas |
| Crítico | intervir fila/escalacoes | Desbloqueio |
| Financeiro | Ledger/Pay superfície | Visibilidade 🟡 |
| Pessoas | supervisionar Admins | Cadeia saudável |

### 20.4 Founder

| Bloco | Accao | Output |
|-------|-------|--------|
| Empresa/Pessoas | promote | Roles correctos |
| Flags/KOCC | configurar | Comportamento gated |
| Escalações topo | resolver | Fecho institucional |
| Financeiro | Super + RPC comissão | Parametros |
| Auditoria | rever | Evidência |

## 21. KAI, Board, Investor, Auditor — notas finais

- KAI: score preliminar na fila; não vota; não e papel.
- Board/Investor: ⚪/🔴 sem ExperienceMode; não abrir nestes manuais como ecrã existente.
- Auditor: papel DB + promote target; sem cockpit ExperienceMode; consulta institucional.

## 22. Fontes de verdade

- role-experience.ts · role-operating-matrix.ts · nav.ts
- publication-review-client.ts · PublicationReviewQueue · AdminHubClient
- EscalationPanel · escalation-client
- FounderCenterClient · FounderOnboardingClient · institutional-client
- SQL 0036, 0037, 0038, 0039, 0040
- ROLE_OPERATING_VALIDATION_POST_DEPLOY.md · SPRINT_BETA_1_6.md
- MANUAL_PLATFORM_AUDIT_SNAP_2026-08-09.md

Fim do Manual Operacional e Administrativo v2.



## Apêndice A — Runbooks operacionais

### A.1 Runbook SLA da fila
1. Abrir `/app/admin` e ordenar mentalmente por `sla_deadline_at` / `escalated_at`.
2. Self-assign nos itens sem dono.
3. Se falta informação: `request_documents` ou `request_corrections` com codes.
4. Se risco: `request_technical_visit` ou `fraud_suspicion` + escalação.
5. Se pronto e for Adminish: `approve`.
6. Se Supervidor e pronto: escalar a Admin com motivo «Pronto para approve».

### A.2 Runbook fraude suspeita
1. Decisão `pending` ou `request_technical_visit` com `fraud_suspicion` e/ou `technical_visit_needed`.
2. Atribuir Agente via `/app/admin/utilizadores` / processo.
3. Contactar PP com linguagem factual (sem acusação pública).
4. Criar escalação prioridade alta a Admin/Super com prazo curto.
5. Só Adminish rejeita (`arquivado`) após evidência.

### A.3 Runbook escalate → resolve
1. Criar escalação com reason + priority + dueHours + target.
2. Alvo faz **acknowledge**.
3. Trabalhar (fila, pessoas, KOCC).
4. **resolve** com notas.
5. Confirmar eventos `escalation.create` / `acknowledged` / `resolved` na auditoria.

### A.4 Runbook primeiro Owner (produção)
1. Conta real (não demo) com email confirmado.
2. Confirmar `bootstrapOpen: true` em `/app/fundador`.
3. Claim Owner.
4. Sair/entrar; experiência Founder.
5. Tab Pessoas: promover Super e Admin com motivos.
6. Feature Flags / KOCC / Segurança email dual-confirm.
7. **Não** publicar o procedimento de claim em canais abertos após fecho.

### A.5 Runbook comissão 35%
1. Não procurar ecrã — não existe.
2. Founder autentica e chama `founder_set_commission_param` (SQL/RPC) com código/valor/notas.
3. Validar linha em `platform_commission_params`.
4. Registar mudança na auditoria/ops log interno.

---

## Apêndice B — Scripts de validação mental (pós-acção)

| Após… | Verificar |
|-------|-----------|
| pending | review_status, lifecycle, notificação PP, reasons[] |
| approve | status=active, janela_premium, premium/general_visible_at |
| reject | arquivado + draft |
| assign | assigned_to / assigned_at |
| escalate | linha no EscalationPanel + audit |
| promote | user_roles + directory + audit institutional.promote |
| claim | founders is_owner, bootstrap fechado |

---

## Apêndice C — Separação de deveres

```
Quem analisa (Supervisor)  !=  Quem aprova (Adminish)
Quem activa património (PP) !=  Quem publica (Adminish)
Quem visita (Agente)       !=  Quem decide publicação
Quem governa (Founder)     !=  Quem faz fila diária (Admin/Sup)
Quem pontua (KAI)          !=  Quem decide (humano)
```

---

## Apêndice D — Glossário ops

| Termo | Definição operacional |
|-------|----------------------|
| Adminish | Founder/Owner/Co-Founder/Administrator/Super — pode approve/reject |
| Central de Trabalho | `/app/admin` com fila + escalações + audit |
| Cockpit do Supervisor | Mesmo `/app/admin` com copy/missão de Supervisor |
| Janela premium | ~6 horas pós-approve antes do feed geral |
| MODE_LENS | Máscara de permissões da experiência activa |
| PATH_RULE | Gate de rota por permissão efectiva |
| Bootstrap | Claim único do primeiro Owner |
| System demo | Contas `demo.*` / `is_system_demo` — sem governação |

---

## Apêndice E — Wireframes adicionais

```
MODELO DE INTERFACE — exemplo conceptual
ESCALAÇÃO
+--------------------------------------------------+
| Escalações operacionais                          |
| Motivo: ________________________________         |
| Alvo: [Admin v]  Prioridade: [Alta v]  Prazo: 12h|
| [ Criar escalação ]                              |
|--------------------------------------------------|
| Lista: ID | alvo | prioridade | SLA | estado     |
| [ Assumir ] [ Resolver ] [ Cancelar ]            |
+--------------------------------------------------+
```

```
MODELO DE INTERFACE — exemplo conceptual
PROMOÇÃO INSTITUCIONAL (Pessoas)
+--------------------------------------------------+
| Directório institucional                         |
| user_id | email | roles | demo?                  |
|--------------------------------------------------|
| Promover: papel [supervisor v]                   |
| Motivo (obrigatório): ______________________     |
| [ Promover ]   (demos bloqueadas)                |
+--------------------------------------------------+
```

---

## Apêndice F — Matriz semanal sugerida

| Dia | Supervisor | Admin | Super | Founder |
|-----|------------|-------|-------|---------|
| Seg | Fila SLA | Approves críticos | KOCC | Pessoas/Flags |
| Ter | Pendências + PP | Moderação/KYC | Escalações | Auditoria |
| Qua | Visitas técnicas | Contratos | Ledger superfície | Segurança |
| Qui | Atribuição agentes | Fila + audit | Critico | KOCC |
| Sex | Fecho SLA | Relatório ops | Super review | Escalação topo |
| Fim-de-semana | Plantão só se SLA | Idem | Idem | Só crítico |

---

*Manual Operacional e Administrativo v2 — alinhado ao código e ao snap 2026-08-09.*
