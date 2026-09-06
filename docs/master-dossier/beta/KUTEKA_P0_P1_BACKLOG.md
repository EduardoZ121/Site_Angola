# Kuteka — Backlog P0 / P1 (só o que importa para testar)

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-09-04 |
| **Fase** | Priorização. **Não autoriza implementação.** |
| **Fonte** | [`KUTEKA_REQUIREMENTS_BASELINE.md`](./KUTEKA_REQUIREMENTS_BASELINE.md) |
| **Regra** | Corrigir o que já existe antes de reconstruir. P0 não é um backlog gigante. |

P2/P3 estão só na baseline. Não os execute.

Tarefas P0/P1 são **primeiro TESTE**. “Implementar” só se o critério falhar **ou** se o item já for MUST FIX confirmado — e só após o Founder escrever `AUTORIZO` com escopo.

---

## Ordem de execução (quando autorizado)

```
TESTAR (playbook MTP)
  → se passar: não tocar
  → se falhar: MUST FIX pontual (bug/UX/copy/permissão)
  → se for estrutural: parar e devolver ao Founder
```

---

## P0 — Bloqueia o teste seguro e coerente

Oito itens. Cinco primeiros = a fila imediata.

### 1. KUT-REQ-001 — Registo / autenticação — MUST TEST

| | |
|--|--|
| **Acção agora** | Correr o fluxo com 1 conta nova. Sem código. |
| **Implementar só se** | 500, email preso, loop de login, recuperação partida. |
| **Aceitação** | Conta criada → verifica (se o ambiente exigir) → `/app` → logout/login. |
| **Complexidade** | baixa |
| **Tipo** | BLOCKER se falhar |

### 2. KUT-REQ-005 — Pay sandbox — MUST TEST

| | |
|--|--|
| **Acção agora** | Inspeccionar Super Pay: `adapter_code`, `custody_mode`, ausência de chaves live. |
| **Implementar só se** | Adaptador live ou custódia ≠ `none`. |
| **Aceitação** | Intents de teste não movem dinheiro real. |
| **Complexidade** | baixa |
| **Tipo** | BLOCKER de segurança |

### 3. KUT-REQ-006 — Email-change não activo — MUST TEST

| | |
|--|--|
| **Acção agora** | Founder abre `/app/centro-seguranca`. Confirmar que D5 se cumpre na UI. |
| **Implementar só se** | CTA completa `confirm_email_change`. Aí: **desligar UI apenas** (não dropar RPCs/`0038`). |
| **Aceitação** | Sem fluxo de mudança de email institucional. |
| **Complexidade** | baixa |
| **Tipo** | BLOCKER de identidade |

### 4. KUT-REQ-002 — Onboarding intenção ≠ role — MUST TEST

| | |
|--|--|
| **Acção agora** | Conta nova: escolher intenção Cliente. Verificar `roles` / destino. |
| **Implementar só se** | Intenção gravar `patrimonial_partner` / `certified_agent` / `administrator`. |
| **Aceitação** | Destino Cliente; sem promoção automática. |
| **Complexidade** | baixa / média |
| **Tipo** | BLOCKER de coerência RBAC |

### 5. KUT-REQ-007 — DEMO ≠ público — MUST TEST → MUST FIX se vazar

| | |
|--|--|
| **Acção agora** | Conta não-demo: Explorar. Há fichas `is_demo` / catálogo `0012`? |
| **Implementar só se** | Modo B (público) **ou** testers internos a confundir DEMO com real. Solução mínima: filtrar feed público / não usar contas demo. **Não** apagar seed. **Não** migration destrutiva. |
| **Aceitação** | Tester do modo escolhido não vê DEMO como mercado. |
| **Complexidade** | média |
| **Tipo** | BLOCKER no modo público · NÃO-BLOCKER no modo A se o playbook usar só contas reais e ignorar demo |
| **Depende** | OPEN-01 |

---

### 6. KUT-REQ-003 — Cliente explora habitação — MUST TEST

Aceitação: `/app/habitacao` + ficha sem 500; sem poderes Admin.  
**Tipo:** BLOCKER de produto se `/app` Cliente estiver vazio/partido.

### 7. KUT-REQ-004 — PP regista sem auto-publicar — MUST TEST

Aceitação: novo património em estado não-público; não entra no Explorar como disponível.  
**Tipo:** BLOCKER de negócio se auto-publish.

### 8. KUT-REQ-008 — Feedback pelo Help — MUST TEST

Aceitação: Ajuda → `feedback` + `bug` → visível no KOCC.  
**Tipo:** BLOCKER de *aprendizagem* (objectivo 5–6). Widget contextual **não** é P0.

---

## P1 — Importante para o teste (não impede o GO interno)

Ordem sugerida no mesmo dia, *depois* do P0 verde.

| # | ID | Acção | Classe | Aceitação curta | Se falhar |
|---|----|--------|--------|-----------------|-----------|
| 9 | KUT-REQ-009 | Login Agente → `/app/agente` | MUST TEST | Pipeline abre; sem aprovar | Bug UI |
| 10 | KUT-REQ-010 | Rascunho / `em_utilizacao` vs Explorar | MUST TEST | Não aparece como disponível | Copy → P2; leak → MUST FIX |
| 11 | KUT-REQ-014 | Dois testers, uma mensagem | MUST TEST | Envio + isolamento RLS | Bug chat |
| 12 | KUT-REQ-015 | Centro de confiança + ficha | MUST TEST | Explorar sem KYC completo | Folga de gate, não KYC novo |
| 13 | KUT-REQ-013 | Hub `/app/contratos` | MUST TEST | Lista/empty; stub `/app/juridico` ignorado | Bug hub |
| 14 | KUT-REQ-012 | `/app/servicos` | MUST TEST | Empty-state ou lista; take rate ≠ 35% activação | Não criar role |
| 15 | KUT-REQ-011 | CTA “avisar-me” se existir | MUST TEST | Pedido único na tabela **ou** OPEN | Não inventar feature |
| 16 | KUT-REQ-016 | Founder Center 9 tabs | MUST TEST | Founder entra; outros não | Não rebuild |
| 17 | KUT-REQ-020 | KOCC / Painel Beta | MUST TEST | Números ou filtro demo/real | Sem analytics novo |
| 18 | KUT-REQ-018 | Audit Center após 1 acção ops | MUST TEST | Evento **ou** OPEN pontual | Sem novo bus |
| 19 | KUT-REQ-017 | Financeiro read + Pricing Via B | MUST TEST | Sem payout; sem login contabilista | Não unificar tabelas |
| 20 | KUT-REQ-021 | Matriz Supervisor/Admin/Founder | MUST TEST | Supervisor não aprova; Admin não grava Via A | Não novo RBAC |
| 21 | KUT-REQ-019 | Sinal “Beta” visível | MUST TEST | Copy/Ajuda | Welcome = P2 |
| 22 | KUT-REQ-023 | `/termos` `/privacidade` `/cookies` | MUST TEST | HTTP 200 | Copy legal = D-LEG |
| 23 | KUT-REQ-022 | Disciplina comissões no playbook | PREPARE | Script escrito; zero SQL | — |

---

## O que **não** está neste backlog (de propósito)

- Unificar `platform_commission_params` e `finance_commission_rules`
- Delegation Engine, Founder OS, Growth, pontos, referral
- Pay real, custódia, AGT, login de contabilista
- Widget de feedback, funil, 5 tipos, screenshots
- Role Prestador, ads, Knowledge Center
- Qualquer migration / RLS

---

## BLOCKER vs NÃO-BLOCKER (resumo)

| BLOCKER para começar (modo A) | NÃO-BLOCKER |
|-------------------------------|-------------|
| Auth partido | Widget feedback |
| Pay live | Funil KOCC |
| Email-change activo | Prestador como role |
| Onboarding a promover role | Founder OS |
| Cliente/PP ecrãs 500 | Taxas renda/venda |
| Ajuda/feedback 500 | `/app/juridico` stub |
| DEMO no modo B | Unificação comissões |
| Sem contas de teste (ops) | BCP cockpit |

---

## Cinco primeiros itens (fila)

1. **KUT-REQ-001** — provar registo/login.  
2. **KUT-REQ-005** — provar sandbox.  
3. **KUT-REQ-006** — provar D5 na UI.  
4. **KUT-REQ-002** — provar intenção ≠ role.  
5. **KUT-REQ-007** — provar isolamento DEMO no modo escolhido.

Só estes cinco, se verdes no modo A, desbloqueiam o resto do dia de teste (003/004/008 em seguida no mesmo playbook — são P0 de produto/aprendizagem, não “engines” novos).
