# Continuidade do desenvolvimento — Kuteka / Site_Angola

**Actualizado:** 2026-07-31  
**Repo:** https://github.com/EduardoZ121/Site_Angola  
**Regra do PO:** após cada edição concluída → **Deploy** (Actions Deploy Kuteka) e **CI verde** — sem deixar erros conhecidos.

---

## Onde estamos agora (ponto de paragem)

| Camada                     | Estado                                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| **Landing KEOS**           | ✅ Feita e na `main` (publish via `prebuilt` → `gh-pages`)             |
| **CI quality**             | ✅ `.github/workflows/ci.yml` activo e verde                           |
| **PRD-001 Spec**           | ✅ v1.0 Aprovação Funcional                                            |
| **Auth código**            | ✅ Implementado na branch / **PR #5** (ainda **não** merged na `main`) |
| **P2 Supabase `0002`**     | ❌ Diferido pelo PO para arranque; **obrigatório antes de go-live**    |
| **Domínio kutekalink.com** | ⚠️ Ainda pode apontar para Render/legado — ver `DEPLOY_STATUS`         |
| **Vercel `kuteka-api`**    | ⚠️ Check no PR falhou (projecto API separado; não bloqueia Pages)      |

**Estado 2026-07-31 (tarde):** PR #5 **merged** na `main`. Auth UI no export estático / gh-pages. **Parámos aqui (histórico):** auth pronto em  
https://github.com/EduardoZ121/Site_Angola/pull/5  
À espera de: merge → Deploy → configurar Supabase → validar fluxos reais.

---

## Manuais / documentos a usar (por ordem)

| Ordem | Documento                                          | Para quê                           |
| ----- | -------------------------------------------------- | ---------------------------------- |
| 1     | `docs/AI_CONTEXT.md`                               | Memória permanente do produto      |
| 2     | `docs/engineering/DEVELOPMENT_PROCESS.md`          | Como trabalhamos (Fase 1/2, N1–N5) |
| 3     | `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`    | Spec auth (D1–D12, F1–F6, R1–R12)  |
| 4     | `docs/backlog/PRD_001_ENGINEERING_GATE.md`         | Gate P1/P2 + §15 (P2 diferido)     |
| 5     | `docs/backlog/PRD_001_IMPLEMENTATION_READINESS.md` | Pack de implementação (activo)     |
| 6     | `docs/backlog/PRD_001_CONTENT_INVENTORY.md`        | Copy i18n das páginas auth         |
| 7     | `docs/architecture/ADR-004-*.md`                   | Decisões técnicas do módulo auth   |
| 8     | `docs/backlog/PO_ACTION_P1_P2.md`                  | Checklist ops (P2 Supabase)        |
| 9     | `docs/engineering/DEPLOY_STATUS_2026-07-30.md`     | Domínio / Pages / Render           |
| 10    | `docs/security/AUDIT_LOGS_CHECKLIST.md`            | Validar RBAC/audit após migrations |
| 11    | `PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`             | Marca / tom                        |
| 12    | `CONTRIBUTING.md`                                  | Como contribuir no monorepo        |

Índice geral: `docs/README.md`

---

## Próximos passos (sequência recomendada)

### Passo A — Fechar o PR de auth (agora)

1. CI do PR #5 verde ✅
2. **Merge** PR #5 → `main`
3. Confirmar **CI** + **Deploy Kuteka** verdes na `main`
4. Verificar Landing em GitHub Pages

### Passo B — Supabase (P2 + auth real)

1. Criar/abrir projecto Supabase
2. Aplicar migrations na ordem:
   - `0001_foundation.sql`
   - `0002_p0_rbac_and_audit_hardening.sql` ← **P2**
   - `0003_activate_self_serve_roles.sql`
3. Configurar env no ambiente / Vercel / local:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (só server)
4. Auth URLs allowlist + templates email (P4)
5. Testar F1→F6 manualmente

### Passo C — Domínio público (P5)

- DNS `kutekalink.com` → GitHub Pages (ver `DEPLOY_STATUS`)
- Ou reparar Render

### Passo D — Próximos módulos de produto (depois de auth estável)

Seguir roadmap em `AI_CONTEXT` / specs:

1. Shell autenticado /app (hoje é stub)
2. Patrimónios / activar património
3. Passaporte / SCK / KAI (fora do MVP auth)
4. Marketplace / listagens conforme PRDs futuros

---

## Rotas auth já no código (PR #5)

| Rota                        | Fluxo              |
| --------------------------- | ------------------ |
| `/auth/registar`            | F1 Registo         |
| `/auth/entrar`              | F3 Login           |
| `/auth/verificar`           | F2 Email           |
| `/auth/recuperar`           | F5 Pedido          |
| `/auth/recuperar/confirmar` | F5 Nova password   |
| `/auth/onboarding/papeis`   | F6 Papéis          |
| `/auth/onboarding/perfil`   | F6 Perfil          |
| `/auth/sair`                | F4 Logout          |
| `/app` · `/app/admin`       | Stubs autenticados |

Landing CTAs: Começar → `/auth/registar` · Entrar → `/auth/entrar`

---

## Política de qualidade (a cumprir sempre)

1. Antes de merge: `pnpm lint` · `format:check` · `typecheck` · `test` · CI verde
2. Depois de merge na `main`: confirmar **Deploy Kuteka** success
3. Não marcar P2 ✅ sem evidência no Gate
4. Não inventar decisões de negócio — confrontar PRD-001

---

## Credenciais (o que ainda falta)

| Credencial                         | Para quê                                | Estado         |
| ---------------------------------- | --------------------------------------- | -------------- |
| Supabase URL + anon + service role | Auth real + migrations                  | ❌ Em falta    |
| PAT GitHub com `workflow`          | Editar `.github/workflows/*` pelo agent | ❌ (só `repo`) |
| GoDaddy / Render API               | DNS / reparar hosting                   | ❌ 401         |

Sem Supabase a UI auth **abre**, mas login/registo real não completa.

---

## Acção imediata 30s (para CI + Deploy ambos verdes)

O Deploy Kuteka já está **verde**. O CI falha na `main` porque o ficheiro activo
`.github/workflows/ci.yml` ainda tem `version: 10` e o `package.json` tem `packageManager`.

**Faz exactamente isto:**

1. Abre: https://github.com/EduardoZ121/Site_Angola/edit/main/.github/workflows/ci.yml
2. Selecciona **todo** o conteúdo e substitui pelo de:
   https://raw.githubusercontent.com/EduardoZ121/Site_Angola/main/docs/engineering/github-workflows/ci.yml
3. Commit na `main`

Isso remove o `version: 10` e o CI volta a verde (o YAML correcto já está no repo em `docs/`).

Ver também: `docs/backlog/EXTERNAL_BLOCKERS.md`.
