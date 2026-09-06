# Fase 0 — Fecho operacional (P1 / P2 / P3)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-09-04 |
| **Base** | `main` `84a357b` · PR #1 merged |
| **Regra** | Sem parecer jurídico, fiscal ou contabilístico inventado. Sem Fase 1. |

**ZIP oficial:** https://github.com/vicentemakiese/Site_Angola/raw/main/downloads/Kuteka_Documentacao_Completa.zip  
**ZIP Fase 0:** https://github.com/vicentemakiese/Site_Angola/raw/main/downloads/kuteka-fase0/Kuteka_Fase0_Documentos.zip

---

## Pack Advogado — verificação

**Completo.** Pasta `downloads/kuteka-docs-completo/02-Advogado/` (20 ficheiros: capa, LEG pack, Termos, Privacidade, Cookies, POL/CMP/BCP/DRP, README — md/pdf/docx) + modelo renda em `06-Modelo-Renda/` + pending em `01-Founder-Fase0/`.

### Questões para parecer (não são respostas)

1. D-LEG-RENT — cobrança de renda + liquidação ao PP + comissão, via PSP, sem custódia indevida; estrutura contratual.
2. LEG-001/003 — enquadramento Kuteka (plataforma / intermediário / agregador) para Pay em Angola (BNA).
3. Merchant of record — Kuteka, PP ou PSP.
4. LEG-011 — cláusulas mínimas nos Termos PP (renda, saldo PP, comissão, fim de contrato).
5. Termos / Privacidade / Cookies v1 — aprovar, corrigir ou bloquear antes de Pay real.
6. ADVICE-001 — parecer formal Pay: custódia vs processamento/liquidação.

### Mensagem para o advogado

```
Assunto: Kuteka — Pedido de parecer Fase 0 (Pay / renda / liquidação PP)

Caro/a Dr(a).,

Segue o pack documental da Fase 0 da Kuteka para parecer jurídico.

Prioridade: modelo de cobrança de renda com liquidação ao Parceiro Patrimonial (PP)
e comissão Kuteka, distinguindo custódia indevida de processamento via PSP.

Peço resposta às perguntas do pack (D-LEG-RENT, LEG-001/003, LEG-011, Termos v1).
Não pedimos implementação — apenas parecer e estrutura contratual recomendada.

ZIP: https://github.com/vicentemakiese/Site_Angola/raw/main/downloads/Kuteka_Documentacao_Completa.zip
Pastas: 02-Advogado + 06-Modelo-Renda + 01-Founder-Fase0

Cumprimentos,
Makiese Vicente — Founder, Kuteka
```

---

## Pack Contabilista — verificação

**Completo.** Pasta `downloads/kuteka-docs-completo/03-Contabilista/` (17 ficheiros: capa, FIN pack, C1, C2, Arquitectura Financeira, canvas — md/pdf/docx) + modelo renda em `06-Modelo-Renda/`.

### Questões para validação contabilística/fiscal (não são respostas)

1. D-FIN-RENT — como classificar renda total, comissão Kuteka e saldo PP (pass-through vs receita bruta).
2. D-FIN — tratamento da comissão de activação 35%.
3. FIN-008 — campos mínimos do pacote mensal para AGT/contabilidade.
4. ADVICE-002 — parecer formal comissões.
5. ADVICE-003 — facturação e documentos fiscais quando houver cobrança real.
6. D7 — login na plataforma ou entrega offline via Founder.

### Mensagem para o contabilista

```
Assunto: Kuteka — Pedido de parecer contabilístico Fase 0 (comissões / renda)

Caro/a Contabilista,

Segue o pack financeiro da Fase 0 da Kuteka.

Prioridade: tratamento da comissão 35% e do fluxo renda Cliente → comissão Kuteka → saldo PP.

Peço parecer às perguntas do pack (D-FIN-RENT e D-FIN).
Não pedimos implementação — apenas classificação e recomendações.

ZIP: https://github.com/vicentemakiese/Site_Angola/raw/main/downloads/Kuteka_Documentacao_Completa.zip
Pastas: 03-Contabilista + 06-Modelo-Renda

Cumprimentos,
Makiese Vicente — Founder, Kuteka
```

---

## P1 — Ficha única Founder

Recomendação = documental/operacional. Jurídico/fiscal só após parecer.

### D1 — Comissão 35% (fonte única)
- **Estado:** **DECIDIDO — A** (2026-09-04). Fonte = `platform_commission_params` Founder-only.
- **Opções:** (A) params Founder-only · (B) Super UI · (C) Híbrido · (D) Manter dual até data X
- **Recomendação documental:** A como fonte estratégica; B alinhado depois. Sem unificar código.
- **Decisão necessária:** — registada. Unificação de código **não** autorizada.
- **Profissional:** Founder

### D-LEG-RENT — Renda + liquidação PP
- **Estado:** KUT-BIZ-RENT-001 documentado; estrutura legal aberta.
- **Opções:** (A) agregador + PSP split · (B) Kuteka só comissão, PP recebe directo · (C) híbrido gestão · (D) advogado especifica
- **Recomendação documental:** Não decidir sem parecer. Enviar pack advogado.
- **Decisão necessária:** Aguardar parecer; Founder escolhe estrutura depois.
- **Profissional:** Advogado + Founder

### D-FIN-RENT — Contabilização renda
- **Estado:** Fluxo documentado; classificação aberta.
- **Opções:** Conforme plano de contas e parecer (pass-through vs receita bruta).
- **Recomendação documental:** Não decidir sem parecer. Enviar pack contabilista.
- **Decisão necessária:** Aguardar classificação; Founder confirma.
- **Profissional:** Contabilista + Founder

### D-LEG — LEG-001–003
- **Estado:** Outlines; Pay real bloqueado.
- **Opções:** Validado / Pendente / Rejeitado por instrumento.
- **Recomendação documental:** Pedir ADVICE-001. Sem activar Pay.
- **Decisão necessária:** Aceitar ou pedir revisão do parecer.
- **Profissional:** Advogado + Founder

### D-FIN — Comissão 35% fiscal
- **Estado:** 35% de negócio fechada; tratamento fiscal aberto.
- **Opções:** Conforme parecer do contabilista.
- **Recomendação documental:** Pedir ADVICE-002. Não alterar os 35%.
- **Decisão necessária:** Aceitar classificação sem mudar a taxa.
- **Profissional:** Contabilista + Founder

### D3 — DEMO / Beta
- **Estado:** **DECIDIDO — DEMO INTERNAL ONLY** (2026-09-04).
- **Opções:** Demo interno only · Badge ilustrativo · Bloquear demo em prod
- **Recomendação documental:** Demo interno only; sem rótulo “Demo” ao público.
- **Decisão necessária:** — registada. Sem misturar DEMO com Beta público.
- **Profissional:** Founder

### D4 — Growth Engine N0–N5
- **Estado:** **DECIDIDO — N1** (2026-09-04). Teto = instrumentação. Código Growth bloqueado.
- **Opções:** N0 nada · N1 instrumentação · N2 partilha · N3+ referral/campanhas
- **Recomendação documental:** N0 ou N1 na Beta pública até parecer legal de campanhas.
- **Decisão necessária:** — registada. Sem activar N2+.
- **Profissional:** Founder (+ advogado se N3+)

### D5 — Alteração de email Founder/Co-Founder
- **Estado:** **DECIDIDO — A / NÃO ACTIVAR** (2026-09-04).
- **Opções:** (A) Manter preparado · (B) Activar com testes §29.12
- **Recomendação documental:** Manter não activado até testes + autorização dedicada.
- **Decisão necessária:** — registada.
- **Profissional:** Founder

### D7 — Papel do contabilista
- **Estado:** **DECIDIDO — B / SEM LOGIN** (2026-09-04).
- **Opções:** (A) Login read-only futuro · (B) Offline · (C) Export Founder-only
- **Recomendação documental:** Começar B ou C até o volume justificar login.
- **Decisão necessária:** — registada. Sem criar role/RBAC.
- **Profissional:** Founder + Contabilista

---

## P2 — Pedidos prontos a enviar

### ADVICE-001 — Kuteka Pay / regulatório
- **Validar:** Enquadramento legal do Pay em Angola; custódia vs processamento; BNA; pré-requisitos para activação real.
- **Anexos:** LEG-003, KUT-BIZ-RENT-001, D-LEG-RENT, pack `02-Advogado`.
- **Destinatário:** Advogado

### ADVICE-002 — Comissões
- **Validar:** Tratamento contabilístico/fiscal da comissão 35% e dos splits.
- **Anexos:** C2, FIN-005, FIN pack, pack `03-Contabilista`.
- **Destinatário:** Contabilista

### ADVICE-003 — Facturação
- **Validar:** Documentos fiscais mínimos quando houver cobrança real (renda/serviços).
- **Anexos:** FIN-008, Arquitectura Financeira §14.
- **Destinatário:** Contabilista

### Revisão Termos / Privacidade / Cookies v1
- **Validar:** Aprovar, corrigir ou bloquear os três instrumentos v1 **antes** de Pay real.
- **Anexos:** `02-Advogado/TERMOS_UTILIZACAO_v1`, `POLITICA_PRIVACIDADE_v1`, `POLITICA_COOKIES_v1`.
- **Destinatário:** Advogado

### Revisão LEG-011 — Termos PP vs modelo renda
- **Validar:** Cláusulas mínimas para cobrança de renda, liquidação do saldo ao PP, comissão Kuteka e fim de contrato.
- **Anexos:** KUT-BIZ-RENT-001, D-LEG-RENT, Termos v1.
- **Destinatário:** Advogado

Registar respostas no template `KUT-ADVICE`. **Não simular pareceres.**

---

## P3 — O que pode ser arquivado depois (não agora)

| Item | Estado agora | Arquivar só depois de |
|------|----------------|------------------------|
| Ponte `EduardoZ121/Meu-site-222` / `kuteka-fase0-export-e12272f` | Intacta @ `a327caff` | Founder confirmar `main` estável |
| Branch `cursor/fase0-publish-9893` | Intacta @ `f4f2911` | Mesma confirmação |
| BCP/DRP v0.9 em `docs/operations/` | Válidos; cópias no pack | Promoção KUT-BCP/DRP só com OK Founder (D-BCP) — **não executar** |
| Outlines LEG/FIN 🔴 | Incompletos à espera de parecer | Completar só com texto do profissional |
| Docs duplicados (dossier + downloads + ZIP) | Intencional (leitura + envio) | Não apagar; opcionalmente marcar downloads como cópia de envio |

**Não apagar** branches, ZIPs nem ficheiros importantes automaticamente.

---

## P4 — Bloqueado até `AUTORIZO: FASE 1`

Código Beta, Pay real, renda real, Growth Engine, email change, migrations, deploy, RLS/RBAC, alterações de produção.
