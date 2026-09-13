# Resiliência operacional — Beta Kuteka

## Objectivo

Reduzir dependência de uma única pessoa e acelerar recuperação, **sem** inventar governação nova.

## Já existente

| Controlo             | Onde                                                    |
| -------------------- | ------------------------------------------------------- |
| SoT Git              | `EduardoZ121/Site_Angola` (nunca Vicente)               |
| Deploy estático      | `.github/workflows/deploy.yml` → gh-pages + Render hook |
| Headers canónicos    | `apps/web/lib/security-headers.ts`, `render.yaml`       |
| Edge headers runbook | `docs/security/PRODUCTION_EDGE_HEADERS.md`              |
| DRP/BCP              | `docs/operations/DRP_v0.9.md`, `BCP_v0.9.md`            |
| Health               | `/health.json`                                          |
| Feedback auditável   | `beta_feedback` + RLS + KOCC/Admin inbox                |
| Segredos             | `.env.example`; service role só servidor                |

## Melhorias closeout

1. Script CF headers: `scripts/apply-cloudflare-security-headers.mjs`
2. Meta CSP no `layout.tsx` (complementa edge)
3. Inbox Admin para `admin.panel` (continuidade ops se Super/finance indisponível)
4. Documentação de smoke e auditoria Beta

## Exercícios ainda pendentes (ops humanos)

- Restore drill de backup Supabase (DRP §1.2)
- Confirmar 2 admins com `admin.panel` + 1 com `finance.manage` (não partilhar um único login)
- Revogar qualquer PAT exposto; preferir GitHub App / OIDC

## Founder ausente (técnico)

- Deploy continua via push a `main` + Actions
- Feedback continua a gravar via RPC
- Leitura ops via Admin inbox **ou** KOCC
- **Não** cobre: decisões comerciais, pagamentos, GOV-BF
