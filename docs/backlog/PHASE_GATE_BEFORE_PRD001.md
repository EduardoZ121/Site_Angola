# Gate de fase — Antes do PRD-001

**Data:** 2026-07-30  
**Decisão:** A fase de fundação + Landing + código P0 está **integrada em `main`**, mas o **encerramento oficial do P0** e o **domínio de produção** ainda têm pendências operacionais.  
**PRD-001:** Especificação preparada · **Implementação bloqueada** até aprovação da spec **e** encerramento oficial do P0.

---

## 1. Código aprovado em `main`?

| Entrega | PR | Em `main`? |
| ------- | -- | ---------- |
| FASE 1 — Infraestrutura KEOS | [#1](https://github.com/EduardoZ121/Site_Angola/pull/1) merged | ✅ |
| Landing Page (PASSO 1 + 1A) | [#2](https://github.com/EduardoZ121/Site_Angola/pull/2) merged | ✅ |
| P0-1 / P0-2 (RBAC + audit) | [#3](https://github.com/EduardoZ121/Site_Angola/pull/3) merged | ✅ |
| Publish path Landing (prebuilt → `dist` / `gh-pages`) | commits directos em `main` | ✅ |

**Tip `main` verificado:** inclui Landing KEOS, packages `@kuteka/*`, migrations `0001`/`0002`, e snapshot `prebuilt/web-out`.

**Resposta:** Sim — o código de produto aprovado (FASE 1, Landing, P0-1/P0-2) está integrado em `main`.

---

## 2. Deploy concluído com sucesso?

| Alvo | Estado |
| ---- | ------ |
| GitHub Actions **Deploy Kuteka** | ✅ Verde em pushes a `main` |
| Branch **`gh-pages`** | ✅ Landing KEOS publicada |
| GitHub Pages (origem estática) | ✅ `status: built`, CNAME `kutekalink.com` |
| Render / `kutekalink.com` | ❌ Continua a servir marketplace Vite legado |

**Resposta:** Deploy da Landing KEOS **concluído com sucesso** para GitHub Pages (`gh-pages`). Deploy no domínio de produção **não concluído** (origem Render stuck).

---

## 3. URL oficial onde a Landing KEOS está publicada

| URL | Conteúdo actual |
| --- | ---------------- |
| **Publicação KEOS (Pages):** branch `gh-pages` do repo `EduardoZ121/Site_Angola` | Landing *Património. Confiança. Habitação.* |
| Verificação directa (Pages IP + `Host: kutekalink.com`) | Título KEOS correcto |
| https://kutekalink.com | Ainda **não** é a Landing KEOS |

Enquanto o DNS não apontar para Pages (ou o Render não publicar o `dist` KEOS), o URL **público** do domínio oficial continua no legado.

**URL técnico oficial da Landing KEOS hoje:** GitHub Pages a partir de `gh-pages` (CNAME configurado para `kutekalink.com`, à espera de DNS).

---

## 4. Estado de `kutekalink.com`

| Facto | Valor |
| ----- | ----- |
| DNS A `@` | `216.24.57.1` (Render) |
| Título HTML | `Kuteka \| Marketplace em Angola` (Vite legado) |
| `last-modified` origem | 2026-06-30 |
| Bloqueio restante | **Sim — apenas operacional: DNS e/ou serviço Render** |

Não é um bloqueio de código da Landing/P0 em `main`. APIs GoDaddy/Render no ambiente actual devolvem **401**.

---

## 5. Bloqueios técnicos que afectam o início do PRD-001

| Item | Afeta implementação PRD-001? | Notas |
| ---- | ---------------------------- | ----- |
| P0-3 CI (`.github/workflows/ci.yml` no remote) | **Sim** (gate oficial) | Ficheiro está em `docs/engineering/github-workflows/ci.yml`; falta scope `workflow` para activar |
| Migration `0002` aplicada no Supabase remoto | **Sim** | Código em repo; aplicar no projecto Supabase antes de auth real |
| DNS / Render (`kutekalink.com`) | Não para coding | Afeta URL pública; não impede desenvolver auth em preview |
| Spec PRD-001 por aprovar | **Sim** | Metodologia: Especificação → Aprovação → Implementação |

**Conclusão do gate:** **Não** declarar PRD-001 “autorizado a implementar” ainda. Pode-se **rever e aprovar a especificação** em paralelo com o fecho operacional do P0.

---

## 6. Encerramento por sub-fase

| Sub-fase | Estado oficial |
| -------- | -------------- |
| FASE 1 — Infraestrutura | ✅ Encerrada |
| Landing Page (4 níveis) | ✅ Encerrada |
| P0-1 / P0-2 (código + aprovação técnica) | ✅ Em `main` / aprovados |
| P0 — encerramento oficial (CI + migration + docs) | ⏳ Pendente |
| Domínio produção = Landing KEOS | ⏳ Pendente (DNS/Render) |
| PRD-001 | 📄 Spec pronta · ⏸ Sem implementação |

---

## 7. Próximos passos (ordem)

1. Aplicar `0002` no Supabase + activar CI (runbook P0) → marcar P0 **Encerrado oficialmente**
2. (Opcional paralelo) DNS → GitHub Pages para `kutekalink.com`
3. **Aprovar** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`
4. Só então: implementação PRD-001
