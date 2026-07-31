# Continuidade do desenvolvimento — Kuteka / Site_Angola

**Actualizado:** 2026-07-31  
**Repo:** https://github.com/EduardoZ121/Site_Angola  
**Regra do PO:** após cada edição concluída → **Deploy** (Actions Deploy Kuteka) e **CI verde** — sem deixar erros conhecidos.

---

## Onde estamos agora (ponto de paragem)

| Camada                     | Estado                                                     |
| -------------------------- | ---------------------------------------------------------- |
| **Landing KEOS**           | ✅ Feita e na `main` (publish via `prebuilt` → `gh-pages`) |
| **CI quality**             | ✅ `.github/workflows/ci.yml` activo e verde               |
| **PRD-001 Spec**           | ✅ v1.0 Aprovação Funcional                                |
| **Auth código**            | ✅ Merged `main` + estático `/auth/*` · `/app`             |
| **P2 Supabase `0002`**     | ❌ **Único bloqueio** — precisa `SUPABASE_ACCESS_TOKEN`    |
| **Domínio kutekalink.com** | ✅ KEOS no ar via Render (`/auth/*` · `/app` OK)           |
| **Deploy Kuteka (E4)**     | ✅ Verde com `package-lock.json`                           |

**Estado 2026-07-31:** E3+E4 fechados. Site público = KEOS.  
**Só falta (PO):** token Supabase → `bash scripts/bootstrap-supabase.sh` (ver `EXTERNAL_BLOCKERS.md`).

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

### Passo A — Fechar o PR de auth (feito)

1. CI do PR #5 verde ✅
2. **Merge** PR #5 → `main` ✅
3. Auth estático + stub `/app` republicados
4. E4 mitigado com `package-lock.json` (Deploy Kuteka)

### Passo B — Domínio público (**mais urgente**)

- DNS `kutekalink.com` → GitHub Pages (ver `DEPLOY_STATUS`) — GoDaddy API actual **401**
- Sem isto o site público continua no Render legado

### Passo C — Supabase (P2 + auth real)

1. Criar/abrir projecto Supabase
2. Aplicar migrations na ordem:
   - `0001_foundation.sql`
   - `0002_p0_rbac_and_audit_hardening.sql` ← **P2**
   - `0003_activate_self_serve_roles.sql`
3. Configurar env no ambiente / Pages build / local:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (só server)
4. Auth URLs allowlist + templates email (P4)
5. Testar F1→F6 manualmente

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

## Acção imediata (PO) — o que desbloqueia utilizadores

1. **E3 DNS** — apontar `kutekalink.com` / `www` a GitHub Pages (credenciais GoDaddy actuais dão 401).
2. **E2 Supabase** — projecto + migrations + env para login real.
3. (Opcional) **E1** — PAT com `workflow` para o agent actualizar `deploy.yml` para pnpm.

Ver: `docs/backlog/EXTERNAL_BLOCKERS.md` · `docs/backlog/GO_LIVE_CHECKLIST.md`.
