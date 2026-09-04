# Kuteka — Requirements Baseline (testável)

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-09-04 |
| **Fase** | Documentos → requisitos. **Não autoriza implementação.** |
| **Repo** | `vicentemakiese/Site_Angola` @ `main` `1654ad8` |
| **Fontes** | 3 documentos-fonte Founder (2026-08-28) + ESTADO A (validação) + código em `main` |
| **Sprint** | Beta 2 — bugs, UX, confiança, feedback, métricas KOS. Sem features estruturais novas. |
| **Objectivo** | Conjunto mínimo e correcto para testar a Beta sem retrabalho. |

**Não é:** nova auditoria, backlog de visão, autorização de Fase 1, unificação de schema, nem Growth/Pay real.

**Não reabrir:** D1=A · D3=DEMO INTERNAL ONLY · D4=N1 · D5=A · D7=B.

---

## Como ler

| Classificação | Significado nesta baseline |
|---------------|----------------------------|
| **MUST TEST** | Já existe. Primeiro *provar* com testers. Só corrigir se falhar. |
| **MUST FIX** | Gap conhecido que impede teste seguro/coerente *ou* viola decisão fechada no caminho público. |
| **PREPARE** | Spec/docs. Não implementar agora. |
| **FUTURE** | Visão válida. Fora do mínimo testável. |
| **EXTERNAL-LEGAL** | Advogado / contabilista / PSP / banco. |
| **NOT NOW** | Proibido nesta etapa (estrutural, dinheiro real, motor novo). |

Prioridade: **P0** bloqueia o teste · **P1** importante para o teste · **P2** depois dos primeiros testes · **P3** futuro.

Complexidade = esforço *se* vier a ser autorizado (baixa / média / alta). Não é calendário.

Itens só de visão/política ficam **FUTURE / NOT NOW / EXTERNAL-LEGAL**. Não foram transformados em features.

---

## Comissão — duas estruturas, não duas cobranças

Não são duas taxas de activação. São dois caminhos de *configuração* com usos diferentes.

| | Via A (oficial activação 35%) | Via B (take rate operacional) |
|--|-------------------------------|-------------------------------|
| **Tabela** | `platform_commission_params` | `finance_commission_rules` |
| **Código seed** | `activation_intermediation_first_month_pct` = 35 | `cleaning_default` 12%, `moving_default` 9%, `insurance_default` 12.5%, `internet_default` 10%, `renovation_default` 8% |
| **Quem altera** | Founder/Owner via `founder_set_commission_param` | Super com `finance.manage` via `finance_set_commission` |
| **UI** | Nenhuma | Super → Pricing (`PricingPanel`) |
| **Runtime hoje** | **Param store.** Nenhum fluxo de contrato/activação lido neste baseline consome o 35% para calcular uma cobrança. | **Usada** em pedidos/orçamentos de marketplace (`0020`, `0023`) via `service_providers.take_rate_code` |
| **D1** | Fonte oficial da comissão de **activação** 35% | Não é fonte da activação 35% |

**Conflito real em runtime (activação 35%):** **não demonstrado.** As vias não calculam a mesma linha hoje.

**Risco:** (1) testers/Super confundirem Pricing com a taxa de activação; (2) Super criar no futuro um `code` que imite activação; (3) o 35% oficial ainda não está ligado ao settlement de activação — o valor existe, a cobrança real não.

**Solução futura (não executar):** com `AUTORIZO` dedicado — ligar Via A ao fluxo de activação; manter Via B para marketplace; não apagar `finance_commission_rules`; reconciliação manual até lá.

Arrendamento / venda / serviços como *políticas de taxa* = **EXTERNAL-LEGAL**. Não inventar taxas.

---

## Índice

| ID | Título | Prio | Classe | Estado |
|----|--------|------|--------|--------|
| KUT-REQ-001 | Registo e autenticação | P0 | MUST TEST | existente |
| KUT-REQ-002 | Onboarding: intenção ≠ role | P0 | MUST TEST | parcial |
| KUT-REQ-003 | Experiência Cliente | P0 | MUST TEST | existente |
| KUT-REQ-004 | PP: registar sem publicar | P0 | MUST TEST | existente |
| KUT-REQ-005 | Pay só sandbox | P0 | MUST TEST | existente |
| KUT-REQ-006 | Email-change não activado | P0 | MUST TEST | parcial |
| KUT-REQ-007 | DEMO não público | P0 | MUST FIX | parcial |
| KUT-REQ-008 | Feedback Beta submetível | P0 | MUST TEST | parcial |
| KUT-REQ-009 | Agente: pipeline utilizável | P1 | MUST TEST | existente |
| KUT-REQ-010 | Inventário vs Mercado visível | P1 | MUST TEST | parcial |
| KUT-REQ-011 | Interesse sem oferta | P1 | MUST TEST | parcial |
| KUT-REQ-012 | Serviços / Prestadores | P1 | MUST TEST | parcial |
| KUT-REQ-013 | Contratos (não stub jurídico) | P1 | MUST TEST | existente |
| KUT-REQ-014 | Mensagens | P1 | MUST TEST | existente |
| KUT-REQ-015 | Trust / reputação | P1 | MUST TEST | existente |
| KUT-REQ-016 | Founder Center utilizável | P1 | MUST TEST | parcial |
| KUT-REQ-017 | Financeiro modo seguro | P1 | MUST TEST | existente |
| KUT-REQ-018 | Auditoria nas acções-chave | P1 | MUST TEST | existente |
| KUT-REQ-019 | Badge / honestidade Beta | P1 | MUST TEST | parcial |
| KUT-REQ-020 | KOCC lê métricas Beta | P1 | MUST TEST | parcial |
| KUT-REQ-021 | Hierarquia de papéis intacta | P1 | MUST TEST | existente |
| KUT-REQ-022 | Vias de comissão documentadas no teste | P1 | PREPARE | existente |
| KUT-REQ-023 | Termos / privacidade acessíveis | P1 | MUST TEST | existente |
| KUT-REQ-024 | Feedback contextual (widget) | P2 | PREPARE | ausente |
| KUT-REQ-025 | Labels Inventário vs Mercado | P2 | MUST FIX | parcial |
| KUT-REQ-026 | Prestador experience mode | P2 | FUTURE | ausente |
| KUT-REQ-027 | Ciclo de estados do feedback | P2 | PREPARE | ausente |
| KUT-REQ-028 | Funil / painel aprendizagem | P2 | PREPARE | ausente |
| KUT-REQ-029 | Welcome “KUTEKA BETA” | P2 | PREPARE | ausente |
| KUT-REQ-030 | Founder vê param 35% (read) | P2 | PREPARE | ausente UI |
| KUT-REQ-031 | Delegation Engine | P3 | NOT NOW | ausente |
| KUT-REQ-032 | Founder OS completo | P3 | NOT NOW | parcial |
| KUT-REQ-033 | Growth N2+ / referral / pontos | P3 | NOT NOW | ausente |
| KUT-REQ-034 | Pay real / custódia | P3 | EXTERNAL-LEGAL | sandbox |
| KUT-REQ-035 | Taxas renda / venda / serviço | P3 | EXTERNAL-LEGAL | OPEN |
| KUT-REQ-036 | Publicidade de prestadores | P3 | FUTURE | schema |
| KUT-REQ-037 | Login contabilista / advogado / PSP | P3 | NOT NOW | ausente |
| KUT-REQ-038 | Knowledge Center / 30 PDFs | P3 | FUTURE | docs só |
| KUT-REQ-039 | Novo RBAC / Analytics Engine | P3 | NOT NOW | — |
| KUT-REQ-040 | Visão ecossistema (critério, não feature) | P3 | FUTURE | docs |

---

## Requisitos

### KUT-REQ-001

**Título:** Registo e autenticação  
**Fonte:** Doc 3 Beta §2, §12; fluxos existentes `/auth/*`  
**Intenção:** Testers entram na plataforma sem fricção bloqueante.  
**Estado:** existente  

**Requisito:** Utilizador cria conta, confirma autenticação quando exigido, recupera acesso, inicia sessão e chega à app.

**Prioridade:** P0  
**Classificação:** MUST TEST  
**Dependências:** Auth/Supabase de produção ou ambiente de teste.  
**Riscos:** Gate de verificação a mais; email de confirmação falha; testers presos fora.  
**Critério de aceitação:**
1. Criar conta com email válido de teste.
2. Completar o passo de verificação exigido pelo ambiente.
3. Entrar em `/app`.
4. Terminar sessão e voltar a entrar.
5. Fluxo “recuperar” abre e não parte a página.
6. Falha de credenciais mostra erro compreensível (sem stack).

**Complexidade:** baixa

---

### KUT-REQ-002

**Título:** Onboarding — intenção não atribui role  
**Fonte:** Doc 3 Beta §7; Charter v2 §5  
**Intenção:** Explorar e declarar intenção sem ganhar poderes operacionais.  
**Estado:** parcial (`/auth/onboarding/papeis` + `destination-gate`; precisa prova)  

**Requisito:** Onboarding pode perguntar intenção. Escolher intenção **não** promove automaticamente a PP, Agente, Admin ou Founder.

**Prioridade:** P0  
**Classificação:** MUST TEST  
**Dependências:** KUT-REQ-001. Roles seed.  
**Riscos:** Tester “cliente” a activar património ou a ver Super.  
**Critério de aceitação:**
1. Conta nova chega ao onboarding.
2. Escolhe intenção de cliente / explorar.
3. Role efectivo continua o autorizado (não vira `patrimonial_partner` / `certified_agent` / `administrator` só pela intenção).
4. Chega à experiência Cliente (`/app` / habitação), não a `/app/super`.
5. Pedido de outro papel, se existir, fica em fluxo separado e auditável.

**Complexidade:** baixa (se já correcto) / média (se o formulário escrever roles)

---

### KUT-REQ-003

**Título:** Experiência Cliente — explorar habitação  
**Fonte:** Doc 1 ciclo económico; Doc 3 Cliente baixa fricção  
**Intenção:** Tester Cliente usa o produto principal.  
**Estado:** existente (`/app/habitacao`, explorar, detalhe, social)  

**Requisito:** Cliente autenticado explora listagens, abre ficha, usa acções sociais básicas (ver / gostar / favorito / partilhar conforme UI actual).

**Prioridade:** P0  
**Classificação:** MUST TEST  
**Dependências:** KUT-REQ-001; dados não-DEMO ou conjunto de teste conhecido (KUT-REQ-007).  
**Riscos:** Feed vazio ou só DEMO a parecer mercado real.  
**Critério de aceitação:**
1. `/app/habitacao` e `/app/habitacao/explorar` carregam.
2. Abrir uma ficha (`/app/habitacao/detalhe`).
3. Acções visíveis na ficha não devolvem 500.
4. Sem permissão de Admin/PP por ser Cliente.

**Complexidade:** baixa

---

### KUT-REQ-004

**Título:** Parceiro Patrimonial — registar sem publicar  
**Fonte:** Doc 3 pp.11–16, BETA-08; Charter v2 §2  
**Intenção:** Construir inventário. Registar ≠ publicar.  
**Estado:** existente (lifecycle `0038`, `/app/patrimonios`)  

**Requisito:** PP autenticado cria património em rascunho/submissão. O sistema **não** publica automaticamente no Mercado.

**Prioridade:** P0  
**Classificação:** MUST TEST  
**Dependências:** Conta com role `patrimonial_partner`.  
**Riscos:** Auto-publish; imóvel ocupado a aparecer como disponível.  
**Critério de aceitação:**
1. `/app/patrimonios/novo` permite criar registo.
2. Estado inicial ∈ {`rascunho`, `submetido`, equivalente não-público}.
3. O imóvel **não** aparece no explorar público como disponível sem aprovação.
4. PP vê o registo na sua lista.
5. Transição para Mercado exige passo explícito de activação/aprovação já existente.

**Complexidade:** baixa

---

### KUT-REQ-005

**Título:** Kuteka Pay apenas sandbox  
**Fonte:** Doc 1 Pay; Doc 2 KUT-LEG-003; `0022` “sandbox apenas”; P4 bloqueado  
**Intenção:** Testar o motor sem dinheiro real nem custódia.  
**Estado:** existente (sandbox, `custody_mode = none`)  

**Requisito:** Qualquer intenção de pagamento em teste usa adaptador sandbox. Não há captura real Multicaixa/EMIS/Stripe/Wise. Cockpit não escreve ledger fora das RPCs já autorizadas.

**Prioridade:** P0  
**Classificação:** MUST TEST  
**Dependências:** Flags Pay; ambiente sem chaves live.  
**Riscos:** Gateway live ligado por engano; tester a “pagar” a sério.  
**Critério de aceitação:**
1. Super/Founder abre painel Pay: adaptador efectivo = `sandbox` (ou equivalente sem cobrança).
2. Criar/simular intent (`kuteka_pay_*` / UI existente) **não** move dinheiro real.
3. `custody_mode` continua `none`.
4. Não existe fluxo de testers para “activar gateway live” sem Founder + `AUTORIZO` futuro.

**Complexidade:** baixa

---

### KUT-REQ-006

**Título:** Alteração de email Founder — não activar  
**Fonte:** Doc 3 §29.7/29.14; D5=A; ADR-027; RPCs em `0038`  
**Intenção:** Identidade estável durante o teste. Infra pode existir; produto não oferece o fluxo.  
**Estado:** parcial (RPCs grantados; D5 = não activar)  

**Requisito:** Testers e Founder **não** concluem mudança de email institucional pela UI. Não promover o fluxo.

**Prioridade:** P0  
**Classificação:** MUST TEST  
**Dependências:** D5 fechada. `/app/centro-seguranca`.  
**Riscos:** UI “alterar email” a chamar `confirm_email_change` em produção.  
**Critério de aceitação:**
1. Founder abre Centro de Segurança.
2. Não há CTA activo que complete mudança de email institucional.
3. Se o formulário existir, está desactivado / “não disponível” / não chama confirmação.
4. Identidade continua `user_id` + `founders`.

**Complexidade:** baixa

---

### KUT-REQ-007

**Título:** DEMO não entra no teste público  
**Fonte:** Doc 3 BETA-04; D3; Charter v2 §3; `is_demo` / `0012` / comentário `0036`  
**Intenção:** Testers não confundem catálogo fictício com Mercado.  
**Estado:** parcial (flag existe; inventário demo ainda previsto como visível)  

**Requisito:** No conjunto de testers da Beta (interno ou público), dados/contas DEMO não se apresentam como anúncios reais. Contas `demo.*@kuteka.local` não são testers públicos.

**Prioridade:** P0  
**Classificação:** MUST FIX *(se o explorar público mostrar DEMO como real)* · MUST TEST *(primeiro confirmar o que o ambiente de teste mostra)*  
**Dependências:** D3. Decisão OPEN-01 (testers internos vs públicos).  
**Riscos:** Métricas e confiança contaminadas; viola D3.  
**Critério de aceitação:**
1. Conta tester não-demo abre Explorar.
2. Fichas DEMO não aparecem **ou** estão inacessíveis a essa conta.
3. KOCC/métricas usadas no teste separam demo vs real (já há contagens em `0035` — verificar UI).
4. Nenhuma badge “Exemplo/Ilustrativo” para o público (D3).

**Complexidade:** média (isolamento) / baixa (se o ambiente de teste já filtrar)

**Problema se falhar (não executar):** estado actual (`is_demo` visível) → testers vêem stock falso → impacto D3 + aprendizagem → solução futura: filtro de feed / contas internas only → risco: esconder de mais e deixar Explorar vazio → rollback: repor visibilidade interna.

---

### KUT-REQ-008

**Título:** Feedback Beta submetível  
**Fonte:** Doc 3 §13–19; `beta_feedback` + Help Center  
**Intenção:** Cada sessão de teste produz evidência.  
**Estado:** parcial (form no Help; kinds `feedback` \| `bug`; sem widget contextual)  

**Requisito:** Tester autenticado submete pelo menos um feedback e um bug pelo canal **já existente**. Não exige widget novo para começar o teste.

**Prioridade:** P0  
**Classificação:** MUST TEST  
**Dependências:** `/app/ajuda`; RPC `kocc_submit_beta_feedback`.  
**Riscos:** Canal escondido → zero aprendizagem (objectivo 5–6 do Founder falha).  
**Critério de aceitação:**
1. De `/app` o tester chega a Ajuda (ou caminho documentado no playbook).
2. Submete `feedback` com texto + `page_path`.
3. Submete `bug` com texto.
4. KOCC / Painel Beta incrementa ou lista o envio (ops).
5. Utilizador comum **não** edita/apaga o registo de outros.

**Complexidade:** baixa

---

### KUT-REQ-009

**Título:** Agente — pipeline utilizável  
**Fonte:** Doc 2 agentes; matriz papéis  
**Intenção:** Testar o actor operacional da relação.  
**Estado:** existente (`/app/agente`)  

**Requisito:** Agente certificado entra no cockpit, vê pipeline/explorar agente, não aprova património como Admin.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** Conta `certified_agent`.  
**Riscos:** Agente com botões de Admin.  
**Critério de aceitação:**
1. Login agente → `/app/agente` carrega.
2. Abrir detalhe de um alvo do pipeline/explorar.
3. Não há acção “aprovar/rejeitar publicação” de Admin.
4. Escalação, se existir, sobe na hierarquia (não para o Founder por defeito).

**Complexidade:** baixa

---

### KUT-REQ-010

**Título:** Inventário vs Mercado — dois universos no teste  
**Fonte:** Doc 3 pp.31–32; Charter v2 §2  
**Intenção:** Testers distinguem “registado” de “no mercado”.  
**Estado:** parcial (lifecycle existe; copy UX mista)  

**Requisito:** No teste, um imóvel em rascunho/em utilização **não** é tratado como publicado disponível. Ops/PP conseguem apontar o estado.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** KUT-REQ-004; `lifecycle_status`.  
**Riscos:** Contar stock ocupado como oferta.  
**Critério de aceitação:**
1. Criar ou usar imóvel `rascunho` ou `em_utilizacao`.
2. Explorar público (Cliente) não o mostra como disponível.
3. PP/Admin vê o estado na ficha/lista.
4. Filtro `disponibilidade=futura` (se usado) não mistura com publicados activos de forma silenciosa.

**Complexidade:** baixa (teste) / média (se copy tiver de mudar — P2)

---

### KUT-REQ-011

**Título:** Captar interesse sem oferta disponível  
**Fonte:** Doc 3 p.17; `availability_notify_requests` (`0017`)  
**Intenção:** Não perder procura.  
**Estado:** parcial (RPC/tabela; UX a provar)  

**Requisito:** Cliente consegue pedir aviso em imóvel/contexto de disponibilidade futura **se** a UI actual o expuser. Se a UI não existir, o requisito desce a P2 e marca-se OPEN no playbook — **não** construir motor novo.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** Explore `?disponibilidade=futura`.  
**Riscos:** Inventar feature “Avise-me” paralela à tabela existente.  
**Critério de aceitação:**
1. Abrir fluxo futura / ficha aplicável.
2. Se existir CTA de notificar: submeter uma vez; segundo submit não duplica sem regra; pedido fica na tabela.
3. Se **não** houver CTA: registar OPEN (não-bloqueante) e usar só o explore.

**Complexidade:** baixa / média se CTA em falta e for autorizada depois

---

### KUT-REQ-012

**Título:** Serviços / Prestadores — fluxo existente  
**Fonte:** Doc 2 pp.100–103; `/app/servicos`; `service_providers`  
**Intenção:** Testar o marketplace que já existe, não a rede profissional futura.  
**Estado:** parcial (entidade + UI; sem role seed `prestador`)  

**Requisito:** Tester com acesso a `/app/servicos` lista prestadores e, se o ambiente tiver dados, abre pedido. Não exigir role novo.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** Flag `marketplace`; dados seed/demo **internos**.  
**Riscos:** Tratar Prestador como role em falta = feature estrutural.  
**Critério de aceitação:**
1. `/app/servicos` carrega.
2. Lista ≠ ecrã em branco sem empty-state.
3. Acção de pedido, se visível, não 500.
4. Comissão mostrada, se houver, vem de Via B (take rate), **não** do 35% de activação.

**Complexidade:** baixa

---

### KUT-REQ-013

**Título:** Contratos — hub existente  
**Fonte:** Doc 2 LEG-010+; `/app/contratos`  
**Intenção:** Testar formalização já construída. `/app/juridico` stub **não** faz parte do mínimo.  
**Estado:** existente (hub); stub em `/app/juridico`  

**Requisito:** Utilizador autorizado abre contratos, vê lista/detalhe, inicia criação se o papel o permitir. Não activar assinatura jurídica real.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** KIS/gates se o fluxo os exigir.  
**Riscos:** Confundir stub jurídico com contratos partidos.  
**Critério de aceitação:**
1. `/app/contratos` carrega.
2. Lista ou empty-state claro.
3. `/app/contratos/novo` abre para papel autorizado; Cliente sem permissão vê recusa clara.
4. `/app/juridico` pode permanecer stub — **não** é falha deste requisito.

**Complexidade:** baixa

---

### KUT-REQ-014

**Título:** Mensagens  
**Fonte:** Chat `0033`; `/app/mensagens`  
**Intenção:** Comunicação entre actores do teste.  
**Estado:** existente  

**Requisito:** Dois testers autorizados trocam mensagem num contexto já suportado (ficha/pedido/contrato conforme produto actual).

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** Contas com relação válida (RLS).  
**Riscos:** Chat “global” sem contexto; leak entre testers.  
**Critério de aceitação:**
1. `/app/mensagens` carrega.
2. Enviar uma mensagem visível para o destinatário.
3. Terceiro sem relação **não** lê o fio.
4. Sem 500 no envio.

**Complexidade:** baixa

---

### KUT-REQ-015

**Título:** Trust / reputação visível  
**Fonte:** Doc 3 confiança; `/app/centro-confianca`; `0034`  
**Intenção:** Testers vêem que a plataforma trata identidade/confiança.  
**Estado:** existente  

**Requisito:** Utilizador abre Centro de Confiança / cartão de confiança na ficha. Não completar KYC financeiro.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** KIS existente.  
**Riscos:** Gate KYC a mais no explorar (viola Beta honesta / baixa fricção).  
**Critério de aceitação:**
1. `/app/centro-confianca` ou equivalente carrega.
2. Explorar **não** exige KYC completo.
3. Operação sensível já gated (contrato/pay) continua gated.
4. Denúncia/moderação, se clicável, não 500.

**Complexidade:** baixa

---

### KUT-REQ-016

**Título:** Founder Center utilizável pelos fundadores de teste  
**Fonte:** Doc 1 p.51–52; Doc 2 Founder OS (reutilizar, não rebuild); `/app/fundador`  
**Intenção:** Founder observa o teste (pessoas, flags, KOCC, auditoria, escalações).  
**Estado:** parcial (9 tabs; não é Founder OS completo)  

**Requisito:** Conta Founder/Owner abre o Center existente. **Não** construir tabs novas.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** Bootstrap Founder real (não `demo.*`) — ops.  
**Riscos:** Rebuild do Center; Founder a “fazer de Super” sem necessidade (C7 — não-bloqueante).  
**Critério de aceitação:**
1. `/app/fundador` abre para Founder.
2. Tabs Empresa, Pessoas, KOCC, Auditoria, Flags, Escalações renderizam.
3. Não-Founder é recusado.
4. Ligação a Super/Admin existe e não parte — aceitável neste mínimo.

**Complexidade:** baixa

---

### KUT-REQ-017

**Título:** Financeiro em modo seguro  
**Fonte:** Doc 1 regra dinheiro de terceiros; D7; `/app/financeiro` + Super  
**Intenção:** Ver números sandbox sem activar money-out nem login de contabilista.  
**Estado:** existente  

**Requisito:** Founder/Super com permissão lê painéis financeiros. Sem export AGT, sem login externo, sem unificar comissões.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** KUT-REQ-005; D7.  
**Riscos:** Super a editar Via B a pensar que muda o 35%.  
**Critério de aceitação:**
1. `/app/financeiro` ou Super financeiro abre.
2. Pricing lista regras Via B (serviços), não como “activação 35%”.
3. Contabilista **não** tem login (D7).
4. Nenhuma acção de payout real.

**Complexidade:** baixa

---

### KUT-REQ-018

**Título:** Auditoria nas acções-chave do teste  
**Fonte:** Doc 1 auditoria; Audit Center  
**Intenção:** Reconstruir o que o tester fez.  
**Estado:** existente  

**Requisito:** Acções já instrumentadas (login sensível, finance, marketplace, aprovação) aparecem no Audit Center. Não criar novo audit bus.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** `/app/fundador?tab=auditoria` ou Super.  
**Riscos:** Teste cego se o painel estiver vazio por RLS.  
**Critério de aceitação:**
1. Founder/Super abre Auditoria.
2. Após uma acção admin/marketplace/flag do playbook, o evento correspondente existe **ou** fica OPEN (não-bloqueante se for acção ainda não coberta).
3. Tester Cliente **não** vê o Audit Center institucional.

**Complexidade:** baixa

---

### KUT-REQ-019

**Título:** Honestidade Beta  
**Fonte:** Doc 3 BETA-03/06; Charter v2 §3  
**Intenção:** Tester sabe que está em Beta.  
**Estado:** parcial (KOCC/status; welcome ausente)  

**Requisito:** Pelo menos um sinal visível de Beta (copy, badge ou Ajuda). Welcome modal completo = P2.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** i18n.  
**Riscos:** Tester a julgar produto “acabado” ou “falso”.  
**Critério de aceitação:**
1. Em `/app` ou Ajuda, o tester lê que está em Beta.
2. Não há DEMO público a fingir mercado (KUT-REQ-007).
3. Estados “em breve / preparação” se existirem não mentem disponibilidade.

**Complexidade:** baixa

---

### KUT-REQ-020

**Título:** KOCC — métricas mínimas do teste  
**Fonte:** Doc 3 BETA-26; `0035`  
**Intenção:** Founder vê se alguém usou a Beta.  
**Estado:** parcial  

**Requisito:** Painel Beta/KOCC mostra contagens já existentes (users, imóveis, feedback, prestadores). Sem funil novo.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** KUT-REQ-016.  
**Riscos:** Contar DEMO como utilizadores reais.  
**Critério de aceitação:**
1. Abrir KOCC / Painel Beta.
2. Após KUT-REQ-001 e KUT-REQ-008, pelo menos um número move **ou** o painel explica o filtro demo/real.
3. Sem módulo analytics novo.

**Complexidade:** baixa

---

### KUT-REQ-021

**Título:** Hierarquia de papéis intacta  
**Fonte:** Doc 3 §29.13; `ROLE_OPERATING_MATRIX.md`  
**Intenção:** Cada tester vê a missão do seu papel.  
**Estado:** existente (matriz B+C)  

**Requisito:** Founder → Super → Admin → Supervisor → Agente/Prestador/PP → Cliente. Sem novos níveis.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** Contas por papel (ops).  
**Riscos:** Supervisor a aprovar; Cliente no Super.  
**Critério de aceitação:**
1. Percorrer as contas do playbook.
2. Supervisor **não** aprova/rejeita publicação.
3. Admin **não** edita `platform_commission_params`.
4. Super **não** edita dados institucionais Founder (tabela `founders`).

**Complexidade:** baixa

---

### KUT-REQ-022

**Título:** Vias de comissão — disciplina de teste  
**Fonte:** Doc 2 FIN-005; C2; D1=A  
**Intenção:** Testers financeiros não “corrigem” a taxa errada.  
**Estado:** existente (duas tabelas)  

**Requisito:** No playbook: Via A = activação 35% Founder-only; Via B = take rates marketplace. Não unificar. Não apagar. Não inventar taxa de renda/venda.

**Prioridade:** P1  
**Classificação:** PREPARE  
**Dependências:** D1; KUT-REQ-017.  
**Riscos:** Super a gravar 35% em Via B e achar que cumpriu D1.  
**Critério de aceitação:**
1. Script de teste financeiro cita as duas tabelas e os usos (secção acima).
2. Nenhuma tarefa de teste pede `finance_set_commission` para a activação.
3. Nenhuma tarefa de teste pede migration.

**Complexidade:** baixa

---

### KUT-REQ-023

**Título:** Termos e privacidade acessíveis  
**Fonte:** Doc 2 LEG-020+; páginas marketing  
**Intenção:** Tester / público chega às regras publicadas.  
**Estado:** existente (`/termos`, `/privacidade`, `/cookies`)  

**Requisito:** Links legais abrem. Conteúdo é o v1 publicado — validação jurídica profunda = EXTERNAL.

**Prioridade:** P1  
**Classificação:** MUST TEST  
**Dependências:** D-LEG (não bloqueia o clique).  
**Riscos:** 404; pack draft ≠ página pública.  
**Critério de aceitação:**
1. `/termos`, `/privacidade`, `/cookies` devolvem 200 e texto.
2. Landing/documentação aponta para eles.

**Complexidade:** baixa

---

### KUT-REQ-024

**Título:** Feedback contextual in-page  
**Fonte:** Doc 3 BETA-14  
**Intenção:** Mais feedback, menos fricção.  
**Estado:** ausente (form só em Ajuda)  

**Requisito:** Widget no contexto da página. **Reutiliza** `beta_feedback`. Não segundo sistema.

**Prioridade:** P2  
**Classificação:** PREPARE  
**Dependências:** KUT-REQ-008 a passar. `AUTORIZO` de correção UX.  
**Riscos:** Módulo novo; privacidade de screenshot (BETA-17 = mais tarde).  
**Critério de aceitação:** *(só após autorização)* widget em ≥1 ecrã `/app/*`; kinds reutilizam a tabela; KOCC recebe.

**Complexidade:** média

---

### KUT-REQ-025

**Título:** Copy Inventário vs Mercado  
**Fonte:** Doc 3 BETA-09; glossário  
**Intenção:** Linguagem alinhada aos dois universos.  
**Estado:** parcial  

**Requisito:** Corrigir labels enganadoras *depois* do primeiro teste, se o teste as confirmar.

**Prioridade:** P2  
**Classificação:** MUST FIX *(só com evidência de confusão)*  
**Dependências:** KUT-REQ-010.  
**Riscos:** Rename em massa sem evidência.  
**Critério de aceitação:** Lista de strings enganadoras do teste + correcção pontual; sem novo módulo.

**Complexidade:** baixa

---

### KUT-REQ-026

**Título:** Experience mode Prestador  
**Fonte:** Matriz papéis “Prestador falta”; Doc 2 rede  
**Intenção:** Prestador como actor, não só anúncio.  
**Estado:** ausente (sem role seed)  

**Requisito:** Não criar role/RBAC agora. Backlog v1.1+ salvo `AUTORIZO` estrutural.

**Prioridade:** P2  
**Classificação:** FUTURE  
**Dependências:** OPEN-04.  
**Riscos:** Feature estrutural na Beta 2.  
**Critério de aceitação:** N/A nesta fase — `/app/servicos` basta (KUT-REQ-012).

**Complexidade:** alta

---

### KUT-REQ-027

**Título:** Workflow de estados do feedback  
**Fonte:** Doc 3 BETA-22/23  
**Intenção:** Fechar o ciclo de aprendizagem.  
**Estado:** ausente  

**Requisito:** NOVO→…→RESOLVIDO no KOCC. Preparar spec; não implementar no mínimo.

**Prioridade:** P2  
**Classificação:** PREPARE  
**Dependências:** KUT-REQ-008.  
**Riscos:** Mini-Jira dentro da Kuteka.  
**Critério de aceitação:** Spec reutiliza `beta_feedback`; sem tabela paralela.

**Complexidade:** média

---

### KUT-REQ-028

**Título:** Funil / painel de aprendizagem  
**Fonte:** Doc 3 BETA-27/31  
**Intenção:** Ver abandono e top problemas.  
**Estado:** ausente  

**Requisito:** Não criar Analytics Engine. Extensão futura do KOCC.

**Prioridade:** P2  
**Classificação:** PREPARE  
**Dependências:** D4 N1 (eventos).  
**Riscos:** Dashboard vanidoso.  
**Critério de aceitação:** Fora do mínimo. KOCC actual (KUT-REQ-020) chega para o 1.º teste.

**Complexidade:** alta

---

### KUT-REQ-029

**Título:** Welcome Beta  
**Fonte:** Doc 3 BETA-06  
**Intenção:** O tester entende o objectivo.  
**Estado:** ausente  

**Requisito:** Modal/página curta. Só após evidência de testers perdidos.

**Prioridade:** P2  
**Classificação:** PREPARE  
**Dependências:** i18n; KUT-REQ-019.  
**Riscos:** Mais um overlay.  
**Critério de aceitação:** Texto Beta honesta; sem DEMO.

**Complexidade:** baixa

---

### KUT-REQ-030

**Título:** Founder lê o param de activação 35%  
**Fonte:** D1; Doc 2 7.11 “não hardcode”  
**Intenção:** Founder confirma a fonte oficial sem Super UI.  
**Estado:** ausente UI (RPC/SQL only)  

**Requisito:** UI read-only futura no Founder Center. **Não** unificar com Pricing. Não nesta sprint de teste.

**Prioridade:** P2  
**Classificação:** PREPARE  
**Dependências:** D1; `AUTORIZO` UI.  
**Riscos:** Meter o 35% no Super Pricing (viola D1).  
**Critério de aceitação:** *(futuro)* Founder vê `activation_intermediation_first_month_pct`; Super sem `is_founder` não grava Via A.

**Complexidade:** baixa

---

### KUT-REQ-031

**Título:** Delegation Engine  
**Fonte:** Doc 1 §14.1–14.17  
**Intenção:** Delegar sem transferir propriedade.  
**Estado:** ausente  

**Requisito:** **NOT NOW.** Sem tabelas `delegat*`. Auditar RBAC existente se um dia for autorizado.

**Prioridade:** P3  
**Classificação:** NOT NOW  
**Dependências:** Mapa indelegável; `AUTORIZO` estrutural.  
**Riscos:** Novo eixo de privilégio sobre RLS.  
**Critério de aceitação:** N/A.

**Complexidade:** alta

---

### KUT-REQ-032

**Título:** Founder OS completo  
**Fonte:** Doc 2 pp.1–3  
**Intenção:** Dirigir a empresa por evidências.  
**Estado:** parcial (Center 9 tabs)  

**Requisito:** **NOT NOW.** Reutilizar o Center. Sem segundo painel.

**Prioridade:** P3  
**Classificação:** NOT NOW  
**Dependências:** KUT-REQ-016.  
**Riscos:** Dashboard gigante.  
**Critério de aceitação:** N/A.

**Complexidade:** alta

---

### KUT-REQ-033

**Título:** Growth Engine funcional / referral / pontos  
**Fonte:** Doc 3 p.52; D4=N1  
**Intenção:** Crescimento ético no tempo.  
**Estado:** ausente (paper + `finance_campaigns` ≠ Growth)  

**Requisito:** **NOT NOW.** Teto Beta = instrumentação. Pontos ≠ dinheiro. Sem referral.

**Prioridade:** P3  
**Classificação:** NOT NOW  
**Dependências:** D4; GROWTH-13 jurídico para N3+.  
**Riscos:** Confundir créditos Super com Growth.  
**Critério de aceitação:** Nenhuma campanha de recompensa no teste.

**Complexidade:** alta

---

### KUT-REQ-034

**Título:** Pay real / custódia / AML financeiro  
**Fonte:** Doc 1–2 Pay; P4  
**Intenção:** Infra transaccional quando for legal.  
**Estado:** sandbox  

**Requisito:** **EXTERNAL-LEGAL + NOT NOW.**

**Prioridade:** P3  
**Classificação:** EXTERNAL-LEGAL  
**Dependências:** D-LEG; PSP; `AUTORIZO: FASE 1` ou autorização Pay.  
**Riscos:** Fundos de clientes.  
**Critério de aceitação:** N/A até parecer + autorização.

**Complexidade:** alta

---

### KUT-REQ-035

**Título:** Comissões de arrendamento, venda e serviços (política)  
**Fonte:** Doc 2 pp.99–101; D-FIN-RENT / D-LEG-RENT  
**Intenção:** Taxas versionadas sem hardcode.  
**Estado:** OPEN  

**Requisito:** Não inventar percentagens. Via B já tem take rates de *marketplace*. Renda/venda = parecer.

**Prioridade:** P3  
**Classificação:** EXTERNAL-LEGAL  
**Dependências:** Advogado + contabilista.  
**Riscos:** Hardcode 35% de renda ≠ activação D1.  
**Critério de aceitação:** N/A.

**Complexidade:** alta

---

### KUT-REQ-036

**Título:** Publicidade de prestadores  
**Fonte:** Doc 2 7.15; LEG-042  
**Intenção:** Receita ao longo do ciclo.  
**Estado:** schema (`category='advertising'`)  

**Requisito:** **FUTURE.** Sem UI de anúncios.

**Prioridade:** P3  
**Classificação:** FUTURE  
**Dependências:** LEG-042.  
**Riscos:** Ads sem moderação.  
**Critério de aceitação:** N/A.

**Complexidade:** alta

---

### KUT-REQ-037

**Título:** Login contabilista / advogado / PSP  
**Fonte:** D7=B; Doc 2 FIN-008  
**Intenção:** Profissionais externos sem contas na app.  
**Estado:** ausente (correcto)  

**Requisito:** **NOT NOW.** Canal documental. Não criar roles.

**Prioridade:** P3  
**Classificação:** NOT NOW  
**Dependências:** D7.  
**Riscos:** Superfície de ataque + RLS novo.  
**Critério de aceitação:** Continuar sem esses logins.

**Complexidade:** —  

---

### KUT-REQ-038

**Título:** Knowledge Center / biblioteca A–W / 30 PDFs  
**Fonte:** Doc 3 pp.77–111  
**Intenção:** Empresa ensinável.  
**Estado:** docs Fase 0 + `docs/help`  

**Requisito:** **FUTURE.** Não gerar 30 PDFs. Master Dossier já publicado chega para o teste.

**Prioridade:** P3  
**Classificação:** FUTURE  
**Dependências:** Founder.  
**Riscos:** Documentação paralela ao código.  
**Critério de aceitação:** N/A.

**Complexidade:** média

---

### KUT-REQ-039

**Título:** Novo RBAC / Analytics Engine / sistemas paralelos  
**Fonte:** Protocolo Doc 1; Sprint Beta 2 §5  
**Intenção:** Não destruir o que funciona.  
**Estado:** —  

**Requisito:** **NOT NOW.** Procurar equivalente → auditar → reutilizar.

**Prioridade:** P3  
**Classificação:** NOT NOW  
**Dependências:** `AUTORIZO` estrutural.  
**Riscos:** Retrabalho.  
**Critério de aceitação:** Nenhuma PR destas estruturas nesta baseline.

**Complexidade:** alta

---

### KUT-REQ-040

**Título:** Visão de ecossistema (critério de produto)  
**Fonte:** Doc 1 pp.9–22; KUT-STR-001  
**Intenção:** Kuteka ≠ portal de anúncios.  
**Estado:** docs  

**Requisito:** Princípio. Não é ecrã. Usar como filtro: se a tarefa não aumenta valor, confiança, teste ou aprendizagem — não entra no P0/P1.

**Prioridade:** P3  
**Classificação:** FUTURE  
**Dependências:** Nenhuma.  
**Riscos:** Transformar visão em 20 módulos.  
**Critério de aceitação:** Esta baseline cumpre o filtro.

**Complexidade:** —  

---

## Contagem

| Classe | Qtd |
|--------|-----|
| P0 | 8 (001–008) |
| P1 | 15 (009–023) |
| P2 | 7 (024–030) |
| P3 | 10 (031–040) |
| MUST TEST | 20 |
| MUST FIX | 2 (007; 025 condicional) |
| PREPARE | 8 |
| FUTURE | 4 |
| EXTERNAL-LEGAL | 2 |
| NOT NOW | 6 |

*(Um requisito pode ter classe primária; 007 é MUST FIX condicionado ao resultado do MUST TEST de visibilidade.)*

---

## O que deliberadamente não entrou como feature

Delegação · sucessão · Board · OKR · BCP cockpit · SAF-T/AGT · Anti-desvio KAI · crédito comercial PP · screenshot de feedback · importação 10k imóveis · Growth loop · pontos · sorteios · ads UI · motor de obrigações/cobrança · unificação SQL das comissões.
