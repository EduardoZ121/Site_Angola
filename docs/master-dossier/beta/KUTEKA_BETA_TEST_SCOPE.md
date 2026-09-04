# Kuteka — Beta Test Scope (Minimum Testable Product)

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-09-04 |
| **Fase** | Definição de teste. **Não autoriza implementação.** |
| **Repo** | `vicentemakiese/Site_Angola` |
| **Baseline** | [`KUTEKA_REQUIREMENTS_BASELINE.md`](./KUTEKA_REQUIREMENTS_BASELINE.md) |
| **Objectivo** | Começar testes reais/controlados sem construir módulos novos. |

---

## 1. O que é o Minimum Testable Product

O MTP **não** é um produto novo. É o recorte do que **já está em `main`** e tem de ser exercido de ponta a ponta para:

1. ter uma Beta funcional;
2. testar a experiência real;
3. testar os fluxos de negócio principais;
4. encontrar bugs;
5. recolher feedback;
6. aprender;
7. não abrir features estruturais.

**Dentro do MTP:** A–R abaixo, no estado actual (corrigir só se o teste falhar, salvo P0 de segurança/DEMO).

**Fora do MTP:** Delegation Engine, Founder OS completo, Growth funcional, Pay real, publicidade, login de profissionais externos, sistema jurídico em `/app/juridico`, Analytics Engine, role Prestador, unificação de comissões.

---

## 2. Audiência do primeiro teste (decisão OPEN-01)

| Modo | Quem | Implicação |
|------|------|------------|
| **A — Interno / controlado** *(recomendado para arrancar)* | Founder + 1–2 operadores + contas por papel | Pode começar assim que P0 MUST TEST passar. DEMO interno permitido se **não** for apresentado a externos. |
| **B — Beta pública** | Utilizadores reais | KUT-REQ-007 (DEMO) torna-se bloqueante absoluto. Termos já publicados. Sem Pay real. |

Não misturar DEMO com testers do modo B (D3).

---

## 3. Contas mínimas do playbook

| # | Papel | Para quê | Nota |
|---|-------|----------|------|
| 1 | Cliente | Explorar, interesse, feedback | Sem poderes ops |
| 2 | Parceiro Patrimonial | Registar imóvel | Não auto-publicar |
| 3 | Agente | Pipeline | Não aprovar |
| 4 | Admin ou Supervisor | Fila / revisão | Supervisor ≠ aprovar |
| 5 | Founder (real, não `demo.*`) | Center, KOCC, auditoria | Bootstrap ops |
| 6 | *(opcional)* Super | Pay sandbox / flags read | Não alterar Via A |

Prestador: usar `/app/servicos` com a conta que o produto já permitir. **Não** criar role.

Contas `demo.*@kuteka.local` = System Demo. Só modo A interno. Nunca testers públicos.

---

## 4. Matriz de fluxos A–R

Legenda: **funciona** · **parcial** · **quebrado** · **stub** · **não existe** · **decisão externa**

Estado = leitura de código/`main` + ESTADO A. Runtime de produção = **MUST TEST** (pode divergir). **UNKNOWN** se não houver prova de execução neste passo.

| ID | Fluxo | Estado MTP | Evidência | No 1.º teste? | Se falhar |
|----|-------|------------|-----------|---------------|-----------|
| **A** | Registo / autenticação | **funciona** *(a provar)* | `/auth/registar`, entrar, recuperar, verificar | **Sim — P0** | MUST FIX imediato |
| **B** | Onboarding | **parcial** | `/auth/onboarding/papeis`, `/perfil`; intenção vs role a provar | **Sim — P0** | MUST FIX se intenção gravar role |
| **C** | Cliente | **funciona** *(a provar)* | `/app/habitacao`, explorar, detalhe, social | **Sim — P0** | Bug/UX |
| **D** | Parceiro Patrimonial | **funciona** *(a provar)* | `/app/patrimonios`, activar | **Sim — P0** | Bug se auto-publish |
| **E** | Agente | **funciona** *(a provar)* | `/app/agente` | **Sim — P1** | Bug; não rebuild |
| **F** | Habitação / imóveis | **funciona** *(a provar)* | Listagens + lifecycle `0038` | **Sim — P0/P1** | Bug |
| **G** | Inventário vs Mercado | **parcial** | Estados de ciclo existem; copy UX mista | **Sim — P1** | Labels = P2 se só copy |
| **H** | Interesse sem oferta | **parcial** | `availability_notify_requests`; CTA UNKNOWN | **Sim — P1** | Sem CTA → OPEN, não-bloqueante |
| **I** | Serviços / Prestadores | **parcial** | `/app/servicos`, `service_providers`; sem role | **Sim — P1** | Empty-state/bug; **não** criar role |
| **J** | Contratos | **funciona** *(hub)* / **stub** (jurídico) | `/app/contratos` vs `/app/juridico` stub | **Hub sim — P1** | Stub jurídico **fora** do MTP |
| **K** | Mensagens | **funciona** *(a provar)* | `/app/mensagens`, `0033` | **Sim — P1** | RLS/bug |
| **L** | Trust / reputação | **funciona** *(a provar)* | `/app/centro-confianca`, `0034` | **Sim — P1** | Não apertar KYC no explorar |
| **M** | Feedback Beta | **parcial** | Form em `/app/ajuda`; sem widget | **Sim — P0** (canal Ajuda) | Se Ajuda partida → MUST FIX; widget = P2 |
| **N** | Founder Center | **parcial** | `/app/fundador` 9 tabs | **Sim — P1** | Não redesenhar |
| **O** | Financeiro seguro | **funciona** *(sandbox)* | `/app/financeiro`, Super | **Sim — P1** | Read-only no teste |
| **P** | Pay sandbox | **funciona** *(sandbox)* | `kuteka_pay_*`, `0022` | **Sim — P0** | Live gateway = **BLOCKER** |
| **Q** | Auditoria | **funciona** *(a provar)* | Audit Center | **Sim — P1** | Cobertura omissa = OPEN |
| **R** | Segurança | **parcial** | `/app/centro-seguranca`; email-change **não activar** (D5) | **Sim — P0** (D5 + sandbox) | Expor email-change = MUST FIX |

Nenhum fluxo A–R está classificado **quebrado** sem prova de runtime. Produção kutekalink.com = **UNKNOWN** até o playbook correr.

---

## 5. Sequência de um dia de teste (sem código novo)

**Bloco 0 — Segurança (15 min)**  
P · R: confirmar sandbox e ausência de email-change activo. Se falhar → **parar o teste público**.

**Bloco 1 — Entrada (30 min)**  
A → B → C. Feedback (M) no final do bloco.

**Bloco 2 — Oferta (45 min)**  
D → F → G. Confirmar que rascunho ≠ Mercado.

**Bloco 3 — Relação (45 min)**  
E → K → L → J (hub).

**Bloco 4 — Serviços (20 min)**  
I. Uma listagem / um pedido se existir dado.

**Bloco 5 — Procura ociosa (15 min)**  
H. Se não houver CTA, anotar OPEN e seguir.

**Bloco 6 — Governação (20 min)**  
N → Q → O. KOCC: há feedback e (se possível) user novo.

**Saída:** 1 página: o que funcionou / bugs / copy / o que o tester não percebeu. Sem isto o teste não conta como aprendizagem.

---

## 6. Fora de âmbito (explícito)

| Tema | Porquê |
|------|--------|
| Pay real, custódia, AML financeiro | EXTERNAL-LEGAL + P4 |
| Unificar/apagar `finance_commission_rules` | D1 não autoriza código |
| Inventar taxas renda/venda | D-FIN-RENT / D-LEG-RENT |
| Growth, referral, pontos, créditos de campanha a testers públicos | D4=N1 |
| Delegation / novo RBAC | estrutural |
| Novo Founder Center / Analytics | estrutural |
| Login contabilista/advogado/PSP | D7 + NOT NOW |
| Completar `/app/juridico` | stub; LEG pendente |
| Publicidade | FUTURE |
| Screenshot de feedback / 5 tipos / workflow Jira | P2 |
| Importação 1k–10k | FUTURE |

---

## 7. Critério para dizer “já podemos testar”

**Modo A (interno) — GO se:**

1. A, B, C, D carregam sem 500.
2. P = sandbox.
3. R = email-change não activo.
4. M = um feedback chega ao KOCC.
5. Contas 1–5 existem (ops, não código).

**Modo B (público) — GO se** modo A **e**:

6. DEMO isolado (KUT-REQ-007).
7. Termos/privacidade 200 (KUT-REQ-023).
8. Founder aceita OPEN-01 = B.

**NO-GO (qualquer modo):** gateway live · custódia ligada · email-change institucional activo · tester público em conta `demo.*`.

---

## 8. Relação com Sprint Beta 2

Permitido depois do teste, **só com `AUTORIZO` de escopo**: bugs, UX, confiança, feedback, métricas.

Proibido: módulos novos para “completar o documento-fonte”.

---

## 9. Ambiente

| Item | Estado |
|------|--------|
| Produção | https://kutekalink.com — comportamento = UNKNOWN até teste |
| Código de referência | `main` `1654ad8` (docs Fase 0; produto Beta 1.6) |
| Playbook E2E formal | Parcial (`KUTEKA_BETA_QA_PLAYBOOK_v0.1.md`) — este MTP é o recorte curto |
| Dados | Preferir património de teste real/controlado, não catálogo `0012` demo |
