# Sprint Beta 1.6 — Trust Governance Gate

| Campo         | Valor                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| **Versão**    | 1.1                                                                               |
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

### Fase A — Mínimo para abrir Beta 2

1. **Founders** — tabela + helpers + caminho para contas reais.
2. **Workflow de aprovação** — Em análise → fila Admin/Super → notificações + pendências.
3. **Ficha de activação rica** + **comissão** configurável (35%).
4. **Quatro pilares de governação** (migration `0037`, UI em `/app/admin`) — ver §3.1.

### Fase B — Ainda 1.6 (antes ou em paralelo ao soft-launch)

5. SLA 12h úteis + escalação automática KOCC.
6. Janela premium ~6h (exclusividade Encontrar Casa / Mudança / Concierge).
7. Gestão pós-remodelação + retenção contratual.

### Fase C — Engajamento

8. Like / favorito / comentários / Q&A sob a **galeria de fotos** da ficha (não escondido noutro sítio).
9. Pesquisa global na topbar.
10. Follow + notificações de comunidade (já existe canal `content_reports` + Moderação).

### 3.1 Quatro pilares (fecho da base empresarial)

| Pilar                               | Entrega 1.6                                                                                                   | Estado                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **1. Auditoria Total**              | `write_audit_event` (utilizador, papéis, motivo, IP/UA, antes/depois) + **Audit Center** em `/app/admin`      | ✅ código                    |
| **2. Governação e Moderação**       | Fila de publicação + `content_reports` + **Centro de Moderação**                                              | ✅ base; social UI na Fase C |
| **3. Reputação Global**             | Trust Card + ICK + reviews; resumo enriquecido (positivas/negativas/papéis); timeline de actividade no perfil | ✅ base                      |
| **4. Analytics Operacionais (KOS)** | `kos_ops_metrics` — SLA overdue, aprovação média, taxa rejeição, conversão interesse→contrato                 | ✅ base                      |

**Arquitectura reservada (Conselho Kuteka):** papéis `co_founder`, `board_member`, `investor_readonly`, `auditor`, `supervisor` semeados sem abrir produto — prontos para activação futura.

## 4. Critério de saída → Sprint Beta 2

- [ ] Migrations `0036` + `0037` aplicadas no Supabase remoto
- [ ] Contas Founder reais ligadas em `founders` (PO fornece emails)
- [ ] Novo património **não** aparece em Habitação até aprovação Admin/Super
- [ ] Fila de revisão + Audit Center + Moderação + KOS Analytics visíveis em `/app/admin`
- [ ] Decisões geram notificação + entrada na timeline do Parceiro
- [ ] Comissão base configurável por Founder (default 35%)
- [ ] Ficha de activação com campos ricos
- [ ] PO confirma por escrito a abertura da Beta 2

**Adiado (não bloqueia Beta 2):** social completo sob galeria, pesquisa global, SLA auto-escalação, receita por província.

## 5. Relação com Beta 2

Após Fase A: convidar ~20 Parceiros, ~20 Clientes, ~5 Agentes, ~5 Prestadores; **sem** features novas excepto correcções e conclusão controlada das Fases B/C conforme dados do Painel Beta.
