# Kuteka — Decisões ainda abertas

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-09-04 |
| **Fase** | Só o que ainda precisa de Founder / advogado / contabilista / PSP. **Não autoriza implementação.** |
| **Baseline** | [`KUTEKA_REQUIREMENTS_BASELINE.md`](./KUTEKA_REQUIREMENTS_BASELINE.md) |

---

## Fechadas — não reabrir

| ID | Decisão |
|----|---------|
| **D1 / DEC-2026-004 = A** | Fonte da comissão de **activação** 35% = `platform_commission_params`, Founder-only. Unificação de código **não** autorizada. |
| **D3 / DEC-2026-005** | DEMO INTERNAL ONLY. Sem DEMO público. Sem badge “Exemplo/Ilustrativo” público. |
| **D4 / DEC-2026-006 = N1** | Growth na Beta = instrumentação. Sem referral/pontos/campanhas funcionais. |
| **D5 / DEC-2026-007 = A** | Email-change preparado, **não activar**. |
| **D7 / DEC-2026-008 = B** | Contabilista **sem login**. Canal documental. |

Doc 3 p.52 (“Growth no primeiro lançamento”) **não reabre D4**. Teto da Beta = N1.

---

## Comissão — o que já está decidido vs. o que não está

| Questão | Estado |
|---------|--------|
| São duas cobranças de activação? | **Não.** Duas estruturas. |
| Quem é fonte do 35% de activação? | **D1 = Via A.** |
| Via B (`finance_commission_rules`) serve para quê? | Take rates de **marketplace/serviços** (runtime + Super Pricing). |
| Unificar / apagar Via B? | **Não agora.** |
| O 35% já é cobrado em runtime? | **Não demonstrado.** Param existe; settlement de activação não foi encontrado a ler Via A. |
| Taxa de arrendamento / venda / serviço (política comercial) | **OPEN** — D-LEG-RENT / D-FIN-RENT. Não inventar números. |

---

## Abertas que **bloqueiam o modo de teste** (Founder)

### OPEN-01 — Quem testa primeiro?

| | |
|--|--|
| **Pergunta** | Primeiro teste = **A** interno/controlado ou **B** Beta pública? |
| **Responsável** | Founder |
| **Impacto** | Modo B torna KUT-REQ-007 (DEMO) bloqueante absoluto. Modo A permite GO com contas reais e DEMO só interno. |
| **Recomendação de baseline** | Começar **A**. Não é autorização de código. |
| **Tipo** | BLOCKER de *âmbito* (não de código) |

### OPEN-02 — Contas Founder / testers em produção

| | |
|--|--|
| **Pergunta** | Bootstrap Founder real (não `demo.*`) e contas Cliente/PP/Agente/Admin de teste já existem em kutekalink.com? |
| **Responsável** | Founder / ops |
| **Impacto** | Sem contas o MTP não corre. |
| **Tipo** | BLOCKER operacional · UNKNOWN até o Founder confirmar |
| **Não fazer** | Recriar identidade Founder; alterar `founders`; activar email-change. |

---

## Abertas **não-bloqueantes** para o 1.º teste interno

### OPEN-03 — Isolamento técnico DEMO (quando)

| | |
|--|--|
| **Pergunta** | Se o Explorar público ainda mostra `is_demo`, filtrar já (após `AUTORIZO` de bug/UX) ou só quando OPEN-01 = B? |
| **Responsável** | Founder |
| **Já decidido** | D3 = política. **Não** decidido o momento do isolamento de código. |
| **Tipo** | NÃO-BLOCKER no modo A se testers não usarem DEMO |

### OPEN-04 — Prestador como role operacional

| | |
|--|--|
| **Pergunta** | Prestador continua entidade `service_providers` + `/app/servicos` na Beta, ou vira role/experience mode? |
| **Responsável** | Founder |
| **Recomendação** | Entidade na Beta (não estrutural). Role = v1.1+. |
| **Tipo** | NÃO-BLOCKER |

### OPEN-05 — Primeiro aprofundamento do Founder Center

| | |
|--|--|
| **Pergunta** | Depois dos testes, se houver `AUTORIZO`: aprofundar KOCC/feedback, Finance read-only, ou Pessoas? |
| **Responsável** | Founder |
| **Já decidido** | Não construir Founder OS novo. |
| **Tipo** | NÃO-BLOCKER |

### OPEN-06 — Widget de feedback contextual

| | |
|--|--|
| **Pergunta** | Após o 1.º teste, autorizar widget que **reutiliza** `beta_feedback` (P2) ou manter só Ajuda? |
| **Responsável** | Founder |
| **Tipo** | NÃO-BLOCKER |

### OPEN-07 — UI read-only do param 35% no Founder Center

| | |
|--|--|
| **Pergunta** | Mostrar `activation_intermediation_first_month_pct` ao Founder (sem Super gravar Via A)? |
| **Responsável** | Founder |
| **Já decidido** | Fonte = Via A. **Não** unificar SQL. |
| **Tipo** | NÃO-BLOCKER |

### OPEN-08 — Tabelas Fase 0 de 2026-08-28

| | |
|--|--|
| **Pergunta** | Esta baseline **substitui** as tabelas KUT-XXX / Doc3 de 28-08 como guia de teste, ou convivem? |
| **Responsável** | Founder |
| **Recomendação** | Baseline = guia de teste. Tabelas 28-08 = inventário documental. Não apagar. |
| **Tipo** | NÃO-BLOCKER |

---

## Externas — jurídico / fiscal / PSP

**Não bloqueiam** o MTP sandbox (modo A). **Bloqueiam** Pay real, taxas de renda/venda e texto contratual definitivo.

| ID | Questão | Quem | Notas |
|----|---------|------|-------|
| **D-LEG** | Enquadramento jurídico da plataforma / termos por actor | Advogado | Pack P2 já preparado em `downloads/…/02-Advogado/`. Envio = Founder. |
| **D-LEG-RENT** | Comissão / contrato de arrendamento | Advogado | Não hardcode. Distinto da activação D1. |
| **D-FIN** | Tratamento contabilístico / facturação / AGT | Contabilista | D7 = sem login. FIN-008 = export/off-platform. |
| **D-FIN-RENT** | Tratamento fiscal da comissão de renda | Contabilista | Não inventar taxa. |
| **D-PSP** | Gateway / custódia / dinheiro de clientes | PSP / banco / advogado | Pay permanece sandbox. |
| **ADVICE-001–005** | Pareceres Pay, comissões, facturas, incentivo | Advogado + contabilista | Registo documental; sem app de pareceres agora. |

---

## O que o Founder **não** precisa decidir para começar o modo A

- Unificação das tabelas de comissão  
- Delegation Engine  
- Growth N2+  
- Activar email-change  
- Login de contabilista/advogado  
- Taxa de venda/renda  
- Biblioteca A–W / 30 PDFs  
- Escrever `AUTORIZO: FASE 1`

Para arrancar o teste interno basta **OPEN-01 = A** (ou equivalente) e **OPEN-02** resolvido operacionalmente.

---

## Como responder

```text
OPEN-01 = A | B
OPEN-02 = contas prontas | ainda não | lista: …
OPEN-03 = só no modo B | autorizar filtro depois do teste
OPEN-04 = entidade na Beta
… (opcional)
Não executar.
```

A autorização de *qualquer* correção de código continua a ser uma frase explícita do Founder (escopo + fase). Esta baseline **não** contém `AUTORIZO: FASE 1`.
