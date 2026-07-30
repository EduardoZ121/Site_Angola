# PRD-001 — Authentication & User Management

**Documento:** Especificação de produto (aprovação obrigatória antes de código)  
**Versão:** 0.1 (rascunho para aprovação)  
**Estado:** ⏸ Aguarda aprovação · **Implementação proibida** até gate P0 oficial + aprovação desta spec  
**Módulo:** `apps/web/modules/authentication`  
**Dependências:** FASE 1 ✅ · Landing ✅ · P0-1/P0-2 em `main` ✅ · P0 encerramento oficial ⏳  
**Gate:** `docs/backlog/PHASE_GATE_BEFORE_PRD001.md` · `docs/backlog/P0_ACTIVATION_RUNBOOK.md`  
**Hierarquia:** Manual > Blueprint > Design System > PASSO 0 > `AI_CONTEXT` > este PRD

---

## 1. Contexto

A Kuteka já tem fundação KEOS (Next.js, Supabase/PostgreSQL, RBAC N:N, auditoria controlada) e Landing oficial com CTAs **Começar** / **Entrar** a apontar para `/auth` (placeholder).

O PRD-001 é o **primeiro módulo funcional**: identidade, sessão, onboarding mínimo de perfil/papéis e redirect pós-login — sem dashboards de negócio, sem patrimónios, sem KAI de produto.

### 1.1 Objectivo de negócio

Permitir que um visitante se torne **utilizador autenticado** na plataforma de confiança Kuteka, com papéis oficiais e permissões resolvidas na base de dados — de forma segura, auditável e alinhada ao Design System.

### 1.2 Fora de missão

Não transformar a Kuteka num site de classificados; não portar o auth legado Vite/Google/`localStorage`.

---

## 2. Objectivos

1. Fluxos de **registo**, **verificação de email**, **login**, **logout** e **recuperação de password** com Supabase Auth.
2. Sessão SSR-compatible (cookies) + middleware de refresh; rotas `(app)` protegidas.
3. Consumir **apenas** a fonte oficial de RBAC: `fetchAuthorizationContext` / RPCs P0 (sem matriz TS).
4. Registar eventos críticos de auth via `writeAuditLog` (sem INSERT directo em `audit_logs`).
5. Onboarding mínimo: perfil + aceitação de Termos + activação de papel(is) inicial(is).
6. Redirect inteligente pós-login conforme permissões (`platform.access`, `admin.panel`).
7. Substituir o placeholder `/auth` pelos ecrãs reais, mantendo CTAs da Landing.

---

## 3. Não-objectivos (explícitos)

| Item | Motivo |
| ---- | ------ |
| MFA | Pós-MVP (UX redesign) |
| KYC completo | Pós-MVP |
| Shell / dashboards de negócio | FASE 3 / PRDs seguintes |
| Patrimónios, contratos, wallet, visitas, KAI produto | Fora do PRD-001 |
| Consola admin de gestão de utilizadores | Mais tarde (`admin.panel` só gated) |
| Portar Google OAuth do legado Vite | Re-especificar só se aprovado via Supabase Auth |
| Alterar modelo Multi-Role / monorepo | Arquitectura congelada (ADR-001) |
| Mudança de DNS | Operações; fora deste PRD |

---

## 4. Atores e modelo de identidade

### 4.1 Identidade

- Fonte: `auth.users` + `profiles` (1:1; trigger `handle_new_user` já cria perfil).
- Papéis: tabela `roles` + `user_roles` (N:N). **Nunca** coluna única `role` como fonte de verdade.
- Autorização: `can(permission)` sobre permissions resolvidas na BD.

### 4.2 Papéis oficiais (seed)

| Código | Nome | Permissions seed |
| ------ | ---- | ---------------- |
| `client` | Cliente | `platform.access` |
| `patrimonial_partner` | Parceiro Patrimonial | `platform.access` |
| `certified_agent` | Agente Certificado | `platform.access` |
| `administrator` | Administrador | `platform.access` + `admin.panel` |

### 4.3 Personas do fluxo

- Visitante anónimo (Landing)
- Novo registado (email não verificado → verificado)
- Utilizador com 0 papéis (estado transitório pós-registo)
- Utilizador com 1+ papéis activos
- Administrador (`admin.panel`)

---

## 5. Decisões de produto propostas (para aprovação)

| ID | Decisão proposta | Alternativa | Recomendação |
| -- | ---------------- | ----------- | ------------ |
| D1 | MVP auth = **email + password** (+ verificação email) | Incluir Google OAuth no MVP | **Email+password no MVP**; OAuth = follow-up opcional |
| D2 | Telefone | Obrigatório / opcional / fora | **Fora do MVP** |
| D3 | Papel inicial | Auto-`client` vs picker obrigatório | **Picker leve** após verify (“Como quer usar a Kuteka hoje?”) com opção Cliente pré-seleccionada; permitir Parceiro Patrimonial; Agente/Admin **não** self-serve |
| D4 | Quem atribui `certified_agent` / `administrator` | Self-serve | **Apenas service_role / processo admin** (RPC privilegiada) |
| D5 | Pós-login sem shell FASE 3 | Stub `(app)` mínimo | **Sim** — página `(app)` placeholder por permissão (não dashboard de negócio) |
| D6 | Rotas | `/auth?mode=` vs nested | **Nested:** `/auth/entrar`, `/auth/registar`, `/auth/recuperar`, `/auth/verificar`; aliases Landing: `/auth` → registar, `/auth?mode=entrar` → entrar |
| D7 | MFA | Incluir | **Fora** — listar como PRD futuro |
| D8 | Switcher multi-papel | No auth MVP | **Adiar para Shell**; no MVP basta activar ≥1 papel no onboarding |
| D9 | UI idioma | pt-only | **pt-AO** no MVP (`profiles.locale` default `pt`) |
| D10 | Termos | Checkbox obrigatório no registo | **Sim** + evento audit `auth.terms_accepted` |

*Estas decisões são propostas; a aprovação da spec confirma ou altera D1–D10.*

---

## 6. Fluxos de utilizador

### 6.1 Registo

1. Landing → **Começar** → `/auth` (registar).
2. Email + password (+ confirmar password) + aceitar Termos/Privacidade.
3. `signUp` Supabase → perfil criado pelo trigger.
4. Ecrã “Verifique o seu email” (reenviar permitido com rate limit UX).
5. Link mágico / token Supabase → `/auth/verificar` → sucesso.
6. Onboarding: nome de exibição (se vazio) + escolha de papel inicial permitido (D3).
7. Atribuição de papel via **RPC controlada** (nova — ver §8) + audit `auth.role_activated`.
8. Redirect para stub `(app)` com `platform.access`.

### 6.2 Login

1. Landing → **Entrar** → `/auth/entrar` (ou `/auth?mode=entrar`).
2. Email + password → `signInWithPassword`.
3. Se email não verificado → bloquear entrada na app e mostrar reenvio.
4. Carregar `fetchAuthorizationContext`.
5. Se sem papéis → onboarding de papéis (não dashboard).
6. Se `admin.panel` e path admin futuro → permitir acesso admin stub; senão stub app.
7. Audit `auth.login` (sucesso); falhas sem vazar se a conta existe (mensagem genérica).

### 6.3 Logout

1. Acção explícita na UI autenticada.
2. `signOut` + limpar cookies de sessão.
3. Redirect `/` (Landing).
4. Audit `auth.logout`.

### 6.4 Recuperação de password

1. `/auth/recuperar` → email → `resetPasswordForEmail`.
2. Email Supabase → `/auth/recuperar/confirmar` (ou hash route Supabase) → nova password.
3. Audit `auth.password_reset_requested` / `auth.password_reset_completed`.

### 6.5 Sessão expirada / middleware

- Middleware refresca sessão Supabase em rotas relevantes.
- Acesso a `(app)/*` sem sessão → redirect `/auth/entrar?next=…`.
- Sem `platform.access` após login → onboarding de papéis, não conteúdo de negócio.

---

## 7. UI / UX

### 7.1 Princípios

- Segurança sem fricção (PASSO 0).
- Design System `@kuteka/ui` (tipografia, Orange primário, Slate).
- Sem cards decorativos desnecessários; um trabalho por ecrã.
- Mobile-first; focus rings; `prefers-reduced-motion`.
- Copy em `modules/authentication/content.ts` (separado da estrutura), pt-AO.

### 7.2 Ecrãs MVP

| Ecrã | Rota | Conteúdo mínimo |
| ---- | ---- | --------------- |
| Registar | `/auth`, `/auth/registar` | Email, password, termos, CTA, link Entrar |
| Entrar | `/auth/entrar` | Email, password, CTA, links Registar / Recuperar |
| Verificar email | `/auth/verificar` | Estado + reenviar |
| Recuperar | `/auth/recuperar` | Email |
| Nova password | `/auth/recuperar/confirmar` | Password + confirmar |
| Onboarding papéis | `/auth/onboarding/papeis` | Escolha leve D3 |
| Stub app | `/app` (grupo `(app)`) | Placeholder autenticado (sem módulos de negócio) |

### 7.3 Estados de erro

- Credenciais inválidas: mensagem genérica.
- Rate limit / email: mensagem clara + retry.
- Rede: retry.
- Nunca logar password/token (logger existente).

---

## 8. Modelo de dados e APIs

### 8.1 Reutilizar (obrigatório)

| Artefacto | Uso |
| --------- | --- |
| RPCs `get_user_role_codes`, `get_user_permission_codes`, `user_has_permission` | Autorização |
| `write_audit_log` / `writeAuditLog` | Auditoria |
| `fetchAuthorizationContext` | Contexto de sessão app |
| `@kuteka/auth` helpers | `userHasPermission`, `canAccessPlatform`, `canAccessAdminPanel` |
| `profileUpdateSchema` | Validação perfil |
| Trigger `handle_new_user` | Criação de `profiles` |

### 8.2 Novos (a especificar na implementação pós-aprovação)

| Artefacto | Necessidade |
| --------- | ----------- |
| RPC `activate_initial_roles(role_codes text[])` (security definer, regras D3/D4) | Self-serve seguro de papéis iniciais |
| Policy/RLS complementar se necessário | Sem abrir INSERT livre em `user_roles` |
| Helpers sessão em `apps/web/lib/auth/*` | `getSession`, `requireUser`, `requirePermission`, `signOut` |
| Middleware session refresh | Cookies Supabase SSR |
| Migration `0003_…` | Apenas o estritamente necessário para role activation + (opcional) `terms_accepted_at` em `profiles` |

### 8.3 Eventos de auditoria (nomes canónicos)

`auth.signup` · `auth.login` · `auth.logout` · `auth.email_verified` · `auth.password_reset_requested` · `auth.password_reset_completed` · `auth.terms_accepted` · `auth.role_activated`

---

## 9. Arquitectura de pastas

```
apps/web/
  app/(auth)/auth/...          # rotas UI
  app/(app)/...                # stub autenticado
  modules/authentication/      # components, hooks, services, validators, tests, content.ts
  lib/auth/                    # session + authorization wrappers
  middleware.ts                # refresh + guards
packages/auth, database, types, validation  # reutilizar / estender tipos
supabase/migrations/0003_*.sql # se necessário
```

Sem recriar auth no legado Vite.

---

## 10. Segurança

1. Supabase Auth apenas — passwords nunca em plaintext na BD app.
2. Service role **nunca** no browser.
3. Permissions só via BD (P0).
4. Audit só via `write_audit_log`.
5. RLS mantido; testes de regressão P0.
6. CSRF/session conforme padrão `@supabase/ssr` no App Router.
7. `robots: noindex` nas rotas `/auth/*`.
8. Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; secrets de service só server-side.

---

## 11. Critérios de aceitação

### 11.1 Gate pré-implementação

- [ ] P0 encerrado oficialmente (migration `0002` aplicada + CI verde + docs P0 actualizados)
- [ ] Este PRD **aprovado** (D1–D10 fechados)

### 11.2 Funcional

- [ ] Registo email+password + Termos
- [ ] Verificação de email end-to-end
- [ ] Login / logout com sessão SSR
- [ ] Recuperação de password end-to-end
- [ ] Onboarding de papéis conforme D3/D4
- [ ] Redirect pós-login: sem papel → onboarding; com `platform.access` → `/app`; admin stub só com `admin.panel`
- [ ] Landing Começar/Entrar abrem fluxos reais (deixam de ser placeholder)
- [ ] Utilizador sem `platform.access` não acede conteúdo `(app)`

### 11.3 Segurança / arquitectura

- [ ] Sem matriz `ROLE_PERMISSIONS` em TypeScript
- [ ] Eventos auth em `audit_logs` via caminho controlado
- [ ] Testes unitários multi-role + e2e smoke (registo/login/logout em ambiente de teste)
- [ ] CI obrigatório no PR de implementação

### 11.4 UX / qualidade

- [ ] Lint, typecheck, test, build verdes
- [ ] A11y básica (labels, focus, erros associados a campos)
- [ ] Copy pt-AO; sem emojis; alinhado DS

### 11.5 Quatro níveis (metodologia)

1. Implementação  
2. Auto-revisão técnica  
3. Testes  
4. Validação funcional/visual + **aprovação final**  

---

## 12. Plano de testes (alto nível)

| Tipo | Casos |
| ---- | ----- |
| Unit | Permissions union multi-role; guards; validators |
| Integration | RPC `activate_initial_roles` rejeita admin/agent self-serve |
| E2E | Registo→verify(stub)→onboarding→app; login→logout; reset request UI |
| Segurança | Tentativa INSERT directo `audit_logs` falha; service key ausente no client bundle |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| P0-3 / migration não activos | Gate §11.1 |
| Utilizador sem papéis preso | Onboarding obrigatório + mensagens claras |
| Scope creep para dashboards | Stub `/app` apenas |
| Email Supabase mal configurado | Checklist env no ADR de implementação |
| Confusão com auth legado | Proibido reutilizar `legacy/` auth |

---

## 14. Entregáveis da fase de implementação (após aprovação)

1. Código em branch `cursor/prd-001-authentication-f96b` (nome final na altura)
2. Migration `0003` se necessário
3. ADR-004 (decisões de auth de produto)
4. Relatório de auto-revisão + validação (4 níveis)
5. Actualização `AI_CONTEXT` / notas de módulo

**Não incluído nesta entrega de especificação:** qualquer implementação.

---

## 15. Histórico

| Data | Evento |
| ---- | ------ |
| 2026-07-30 | Spec v0.1 criada para aprovação · implementação bloqueada |

---

## 16. Pedido de aprovação

Pedimos decisão explícita sobre:

1. Aprovação global desta spec **ou** alterações a D1–D10  
2. Confirmação do gate P0 (CI + migration) antes do kickoff de código  
3. Autorização posterior para iniciar implementação sob metodologia oficial
