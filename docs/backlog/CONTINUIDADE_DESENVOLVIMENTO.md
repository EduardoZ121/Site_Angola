# Continuidade do desenvolvimento — Kuteka / Site_Angola

**Actualizado:** 2026-07-31  
**Repo:** https://github.com/EduardoZ121/Site_Angola  
**Regra do PO:** após cada edição concluída → **Deploy** (Actions Deploy Kuteka) e **CI verde** — sem deixar erros conhecidos.

---

## Onde estamos agora (ponto de paragem)

| Camada                     | Estado                                            |
| -------------------------- | ------------------------------------------------- |
| **Landing KEOS**           | ✅ Feita e na `main`                              |
| **CI quality**             | ✅ `.github/workflows/ci.yml` activo e verde      |
| **PRD-001 Auth**           | ✅ **N5** · baseline `PROJECT_BASELINE_PRD001.md` |
| **Supabase remoto**        | ✅ `vhqwitbrpqaiutjbundo` (0001–0003 + seed)      |
| **Domínio kutekalink.com** | ✅ KEOS no ar (Render + gh-pages)                 |
| **Deploy Kuteka**          | ✅ Verde                                          |
| **Fase 3 Shell**           | ▶️ Preparação — `PHASE_3_PLATFORM_SHELL_PREP.md`  |

**Estado 2026-07-31:** Baseline PRD-001 congelada. Em preparação: **Fase 3 — Shell da Plataforma**.

---

## Manuais / documentos a usar (por ordem)

| Ordem | Documento                                       | Para quê                            |
| ----- | ----------------------------------------------- | ----------------------------------- |
| 1     | `docs/AI_CONTEXT.md`                            | Memória permanente do produto       |
| 2     | `docs/PROJECT_BASELINE_PRD001.md`               | Baseline congelada pós-PRD-001      |
| 3     | `docs/engineering/DEVELOPMENT_PROCESS.md`       | Como trabalhamos (Fase 1/2, N1–N5)  |
| 4     | `docs/backlog/PHASE_3_PLATFORM_SHELL_PREP.md`   | Preparação Shell (Fase 3)           |
| 5     | `docs/backlog/PRD_001_CLOSURE.md`               | Encerramento oficial do módulo auth |
| 6     | `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` | Spec auth (referência)              |
| 7     | `docs/architecture/ADR-004-*.md`                | Decisões técnicas do módulo auth    |
| 8     | `docs/backlog/GO_LIVE_CHECKLIST.md`             | Checklist ops / go-live             |
| 9     | `PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`          | Marca / tom                         |

Índice geral: `docs/README.md`

---

## Próximos passos (sequência recomendada)

### 1. Shell da plataforma (fase 3 — em preparação)

Ver `PHASE_3_PLATFORM_SHELL_PREP.md`. Próximo entregável: **spec funcional** até N3 para Aprovação Funcional do PO. **Sem** reabrir polish do stub auth.

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
