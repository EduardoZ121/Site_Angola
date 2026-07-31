# Continuidade do desenvolvimento — Kuteka / Site_Angola

**Actualizado:** 2026-07-31  
**Repo:** https://github.com/EduardoZ121/Site_Angola  
**Regra do PO:** após cada edição concluída → **Deploy** (Actions Deploy Kuteka) e **CI verde** — sem deixar erros conhecidos.

---

## Onde estamos agora (ponto de paragem)

| Camada                     | Estado                                         |
| -------------------------- | ---------------------------------------------- |
| **Landing KEOS**           | ✅ Feita e na `main`                           |
| **CI quality**             | ✅ `.github/workflows/ci.yml` activo e verde   |
| **PRD-001 Auth**           | ✅ **N5 concluído** — ver `PRD_001_CLOSURE.md` |
| **Supabase remoto**        | ✅ `vhqwitbrpqaiutjbundo` (0001–0003 + seed)   |
| **Domínio kutekalink.com** | ✅ KEOS no ar (Render + gh-pages)              |
| **Deploy Kuteka**          | ✅ Verde                                       |

**Estado 2026-07-31:** PRD-001 encerrado. Próximo foco de produto: **Shell da plataforma**, depois PRD-002.

---

## Manuais / documentos a usar (por ordem)

| Ordem | Documento                                       | Para quê                              |
| ----- | ----------------------------------------------- | ------------------------------------- |
| 1     | `docs/AI_CONTEXT.md`                            | Memória permanente do produto         |
| 2     | `docs/engineering/DEVELOPMENT_PROCESS.md`       | Como trabalhamos (Fase 1/2, N1–N5)    |
| 3     | `docs/backlog/PRD_001_CLOSURE.md`               | Encerramento oficial do módulo auth   |
| 4     | `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` | Spec auth (referência histórica/viva) |
| 5     | `docs/architecture/ADR-004-*.md`                | Decisões técnicas do módulo auth      |
| 6     | `docs/backlog/GO_LIVE_CHECKLIST.md`             | Checklist ops / go-live               |
| 7     | `docs/backlog/EXTERNAL_BLOCKERS.md`             | Bloqueios externos                    |
| 8     | `PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`          | Marca / tom                           |
| 9     | `CONTRIBUTING.md`                               | Como contribuir no monorepo           |

Índice geral: `docs/README.md`

---

## Próximos passos (sequência recomendada)

### 1. Shell da plataforma (fase 3 — próximo)

Chrome autenticado estável (navegação, header/sidebar base) sobre a sessão e papéis já entregues no PRD-001 — **sem** reabrir polish cosmético do stub auth.

### 2. PRD-002 — Parceiro Patrimonial

Primeiro módulo de negócio sobre o shell: activar e gerir património.

### 3. Ops opcional

- P4 templates email com marca Kuteka
- E1 — `deploy.yml` activo em pnpm (opcional)

---

## Rotas auth (PRD-001 — estáveis)

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
3. Não inventar decisões de negócio — confrontar PRD / AI_CONTEXT
4. Não reabrir PRD-001 excepto erro crítico de funcionamento
