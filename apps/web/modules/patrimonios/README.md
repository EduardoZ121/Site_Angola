# Module: patrimonios

**PRD-002** — Ativar Património (Parceiro Patrimonial).

## Rotas

- `/app/patrimonios` — lista
- `/app/patrimonios/novo` — activar
- `/app/patrimonios/detalhe?id=` — detalhe (query — static-export safe)

## Regras

1. Escrita exige `properties.manage` (papel `patrimonial_partner`)
2. Sem Passaporte / KAI / marketplace neste MVP
3. Reutiliza Shell + sessão PRD-001
