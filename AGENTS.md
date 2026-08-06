# Agentes — Site_Angola / Kuteka

**Repo:** https://github.com/EduardoZ121/Site_Angola  
**Produção:** https://kutekalink.com  
**Fase oficial:** Kuteka **v1.0 Beta — Operação** (Arquitectura encerrada).

## Regra permanente (Sprint Beta)

Nenhuma funcionalidade entra em desenvolvimento sem estar associada a:

1. um **Sprint Beta** (1–5 ou sucessores documentados);
2. um **objetivo de negócio** explícito;
3. um **critério de sucesso mensurável**.

Se não cumprir os três, **adiar**. Fonte: [`docs/product/SPRINT_BETA_CHARTER.md`](docs/product/SPRINT_BETA_CHARTER.md).

## O que priorizar

- Confiança, operação da empresa, monetização, menos trabalho manual, segurança, UX significativa.
- Não inventar módulos novos fora do Sprint activo.

## Referências rápidas

| Documento | Uso |
|-----------|-----|
| `docs/product/SPRINT_BETA_CHARTER.md` | Ciclos Beta + regra permanente |
| `docs/product/GO_LIVE_READINESS.md` | Bloco Zero (checklist vivo) |
| `docs/product/KUTEKA_ROADMAP_MASTER.md` | Maturidade plataforma |
| `docs/product/KUTEKA_OPERATING_SYSTEM.md` | Operação da empresa (KOS) |
| `docs/operations/` | BCP / DRP v0.9 |
| KOCC | `/app/super` → separador KOCC (migration `0032`) |

## Deploy

- Static: `bash scripts/build-static-web.sh` → `prebuilt/web-out`
- Produção via workflow **Deploy Kuteka**
