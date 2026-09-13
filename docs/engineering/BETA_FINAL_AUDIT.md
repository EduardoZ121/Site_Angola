# Kuteka Beta — auditoria final vs documento estratégico

**Data:** 2026-09-13  
**SoT:** `EduardoZ121/Site_Angola` @ `main` (base `7fce22cf` + closeout)  
**Produção:** https://kutekalink.com  
**Documento de referência:** _Lista de recomendações Kuteka — máxima atenção e importância_ (PDF Founder)

## Método

O PDF é visão estratégica / governação (442 págs.). **Não** foi tratado como backlog de features a inventar.
Foi usado para classificar o que a Beta **já decidida** precisa para ser utilizável, e o que fica **Founder Decision**.

## Matriz (resumo executivo)

| Área                           | Estado                     | Notas                                              |
| ------------------------------ | -------------------------- | -------------------------------------------------- |
| Landing Beta messaging         | A — produção               | Hero Beta pública validado                         |
| Registo / login / onboarding   | A — código+prod HTML       | Auth client-side em static export                  |
| App home + Ajuda feedback      | A — código                 | RPC `kocc_submit_beta_feedback`                    |
| KOCC métricas + inbox          | A — código; B — smoke auth | Inbox ≠ metrics; RLS finance.manage \| admin.panel |
| Admin vê inbox                 | A — closeout               | `AdminBetaInboxPanel` no hub admin                 |
| Headers segurança edge         | C — Cloudflare             | Código+Render+meta OK; edge live incompleto        |
| Health check static            | A — closeout               | `/health.json`                                     |
| GOV-BF / 0043 / 0044 / 0045    | D — Founder                | Proposals only, não aplicadas                      |
| Kuteka Pay / comissões / AML   | D — Founder + legal        | Fora do escopo Beta técnica                        |
| Founder Center delegação total | D / parcial                | Existente; não expandir sem autorização            |
| BCP/DRP disciplina             | B — docs                   | DRP v0.9; restore drill pendente                   |
| Vicentemakiese fork            | Nunca                      | Bloqueado por política                             |

## Ciclo Beta Feedback (decidido e implementado)

```
/app/ajuda → BetaFeedbackForm → kocc_submit_beta_feedback
  → beta_feedback (RLS)
  → KOCC Painel Beta (metrics finance.manage)
  → Inbox SELECT (finance.manage | admin.panel) independente de metrics
  → Admin Hub inbox (closeout)
```

Não inventa workflow de tickets / estados FECHADO (GOV-BF).

## Classificação A/B/C/D (critério mandato)

- **A** Concluído e validado em produção (ou validável sem sessão)
- **B** Concluído tecnicamente, falta validação autenticada em produção
- **C** Bloqueado por dependência externa (CF API, Cursor GitHub App, credencial)
- **D** Decisão Founder / legal / financeira

## Acção humana única urgente

1. **Revogar PAT** partilhado em chat (comprometido).
2. **Cloudflare Transform Rules** OU secrets `CLOUDFLARE_*` no CI (headers).
3. Opcional: instalar **Cursor GitHub App** em `Site_Angola` (Option A) para o agente publicar sem PAT.
