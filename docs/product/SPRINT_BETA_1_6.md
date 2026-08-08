# Sprint Beta 1.6 — Trust Governance Gate

| Campo         | Valor                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| **Versão**    | 1.0                                                                               |
| **Data**      | 2026-08-08                                                                        |
| **Natureza**  | Gate estrutural **antes** da Sprint Beta 2 (Beta Pública)                         |
| **Objectivo** | Reforçar Confiança, Governação, Qualidade de anúncios e Comunicação               |
| **Fontes**    | Observações PO pós–Beta 1.5B · [SPRINT_BETA_CHARTER.md](./SPRINT_BETA_CHARTER.md) |

## 1. Decisão de governação

A Sprint Beta 2 (**convidar utilizadores reais**) **não abre** até o critério de saída desta sprint estar cumprido nos itens da **Fase A** (mínimo viável de confiança).

Isto não são “features isoladas”: são pilares de uma plataforma imobiliária profissional baseada em confiança.

## 2. Pilares (pedido PO)

| #   | Pilar                    | Resumo                                                                                                       |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1   | Aprovação de publicações | Admin/Super activos: Em análise → aprovar / pendência / rejeitar / correcções / visita técnica / docs        |
| 2   | Pendência inteligente    | Motivos padronizados + solução sugerida + notificação ao Parceiro                                            |
| 3   | SLA 12h úteis            | 08h–17h; escalação KAI → Super Admin → KOCC                                                                  |
| 4   | Aprovação comercial      | ~6h exclusivas para clientes premium (Encontrar Casa, Mudança, Concierge, alertas)                           |
| 5   | Comissão de activação    | 35% do 1.º mês (intermediação) — parâmetro Founder/Owner                                                     |
| 6   | Gestão pós-remodelação   | Comercial / Parcial / Total + retenção de custos                                                             |
| 7   | Ficha de activação rica  | Quartos, suítes, WC, garagem, estacionamento, comodidades, áreas, conservação, ano, mobilado…                |
| 8   | Interacção social        | Like/favorito, comentários, perguntas públicas, respostas, denúncia, moderação                               |
| 9   | Pesquisa global          | Páginas, módulos, patrimónios, utilizadores, contratos, serviços, FAQ/Ajuda                                  |
| 10  | Contas Founder           | Tabela `founders` (`is_founder`, `is_owner`); privilégios > Super Admin; abandonar `demo.super@kuteka.local` |
| 11  | Comunidade / feedback    | Sugestões, follow de publicação, notificações de respostas                                                   |

## 3. Fases de entrega

### Fase A — Mínimo para abrir Beta 2 (esta entrega de código)

1. **Founders** — tabela + helpers de privilégio + caminho para contas reais (sem depender de `demo.super`).
2. **Workflow de aprovação** — activação entra sempre em **Em análise**; fila Admin/Super; decisões + notificações ao Parceiro; motivos de pendência padronizados.
3. **Ficha de activação** — campos em falta ligados à ficha (suítes, estacionamento, comodidades booleanas, mobilado, áreas).
4. **Parâmetro de comissão** — `platform_commission_params` (base 35%) editável só por Founder/Owner.

### Fase B — Imediatamente a seguir (ainda 1.6, antes ou em paralelo ao soft-launch)

5. SLA 12h úteis + escalação KOCC.
6. Janela premium ~6h (`general_visible_at`).
7. Modelos de gestão pós-remodelação + retenção contratual (transparência).

### Fase C — Engajamento (pode acompanhar primeiros utilizadores Beta)

8. Like / favorito / comentários / Q&A / denúncia / moderação.
9. Pesquisa global na topbar.
10. Follow + notificações de comunidade.

## 4. Critério de saída → Sprint Beta 2

- [ ] Migration `0036` aplicada no Supabase remoto
- [ ] Contas Founder reais ligadas em `founders` (PO fornece emails)
- [ ] Novo património **não** aparece em Habitação até aprovação Admin/Super
- [ ] Fila de revisão operacional em `/app/admin` (e visível a Super)
- [ ] Decisões geram notificação ao Parceiro
- [ ] Comissão base configurável por Founder (default 35%)
- [ ] Ficha de activação com campos ricos
- [ ] PO confirma por escrito a abertura da Beta 2

**Fora do critério mínimo (Fase A):** SLA automatizado, janela premium 6h, social completo, pesquisa global — documentados e sequenciados na Fase B/C.

## 5. Relação com Beta 2

Após Fase A: convidar ~20 Parceiros, ~20 Clientes, ~5 Agentes, ~5 Prestadores; **sem** features novas excepto correcções e conclusão controlada das Fases B/C conforme dados do Painel Beta.
