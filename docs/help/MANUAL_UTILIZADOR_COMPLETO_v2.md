# KUTEKA — MANUAL COMPLETO DO UTILIZADOR

**Versão:** 2.0 · **Data:** 2026-08-09 · **Idioma:** Português europeu (estilo PT-AO da plataforma: Activar, etc.)

**Produção:** https://kutekalink.com · **Ajuda:** `/app/ajuda` · **Documentação:** `/documentação`

**Auditoria:** `docs/product/MANUAL_PLATFORM_AUDIT_SNAP_2026-08-09.md`

**Destinatários:** Cliente · Parceiro Patrimonial · Agente Certificado · Prestador

Papéis Supervisor / Admin / Super / Founder: ver `MANUAL_OPERACIONAL_ADMINISTRATIVO_v2.md`.

Este manual baseia-se em código, migrações e validação pós-deploy — não em aspiração de produto.

## 0. Como usar este manual

- Confirme o papel DB e a experiência activa (seletor no menu da conta).
- Leia a ficha completa do seu papel (secções 5 a 8 — cada uma com 19 subsecções).
- Use as jornadas (9 a 11), confiança (12), comúnicação (13), serviços (14), checklists (15) e "onde vejo X" (16).
- Respeite a legenda de estado: 🟡/🔵/🔴/⚪ nunca devem ser tratados como fluxo fechado.

## 1. Legenda de estado (oficial)

| Símbolo             | Significado                                                        |
| ------------------- | ------------------------------------------------------------------ |
| 🟢 IMPLEMENTADO     | Existe em código + validado pós-deploy (ou equivalente confirmado) |
| 🟡 PARCIAL          | Existe UI/RPC mas fluxo incompleto, demo, ou pairing em falta      |
| 🔵 PREPARADO        | Infra/SQL/RPC prontos; UI limitada ou sem claim Founder real       |
| 🟠 EM BETA          | Disponível em Beta com restrições documentadas                     |
| 🔴 NÃO IMPLEMENTADO | Sem ecrã/fluxo utilizável na plataforma actual                     |
| ⚪ PLANEADO v1.1+   | Explicitamente adiado / backlog pós-Beta 2                         |

## 2. Entrar na plataforma 🟢

### 2.1 Criar conta

- Abrir https://kutekalink.com e escolher Criar conta (`/auth/registar`).
- Indicar email válido e palavra-passe segura (mínimo 8 caracteres, com maiúscula e número).
- Aceitar os Termos de Utilização (obrigatório).
- Confirmar email em `/auth/verificar` — método A (link) ou B (OTP de 6 dígitos). Pode reenviar com intervalo de segurança.

### 2.2 Entrar e recuperar

- Entrar: `/auth/entrar` com email e palavra-passe.
- Recuperar: `/auth/recuperar` — email, telefone (SMS) ou ambos; confirmar em `/auth/recuperar/confirmar`.

### 2.3 Onboarding de papéis self-serve 🟢

Em `/auth/onboarding/papeis` seleccione Cliente, Parceiro Patrimonial, ou ambos (experiência `client_partner`).

**Não self-serve:** Agente Certificado, Prestador, Supervisor, Administrador, Superadministrador, Founder/Co-Founder — atribuição pela operação / Founder.

### 2.4 Nome e painel

- Nome de apresentação em `/auth/onboarding/perfil` (alterável depois em Perfil).
- Área autenticada: `/app`. A home efectiva depende da experiência activa (secção 3).

```
MODELO DE INTERFACE — exemplo conceptual
+----------------------------------------------------------+
| KUTEKA                         [Experiência v] [Conta]   |
|----------------------------------------------------------|
| Email                                                    |
| Palavra-passe                                            |
| [ Entrar ]          Recuperar acesso                     |
| Criar conta -> /auth/registar                            |
+----------------------------------------------------------+
```

## 3. Como saber o seu papel (experiência) 🟢

### 3.1 Papel DB vs experiência UI

| Conceito                          | Onde                            | Governa                                 |
| --------------------------------- | ------------------------------- | --------------------------------------- |
| Papel DB (`roles` / `user_roles`) | Servidor + RLS                  | O que a conta pode fazer de verdade     |
| Experiência (`ExperienceMode`)    | UI (`kuteka-active-experience`) | Menus, home, missão, lens de permissões |

Permissões UI = intersecção(permissões reais da sessao, `MODE_LENS[experiência]`). Trocar o seletor **não escala** poderes.

### 3.2 Experiências existentes

`client` · `patrimonial_partner` · `client_partner` · `certified_agent` · `service_provider` · `supervisor` · `administrator` · `super_administrator` · `founder`

Nota: papel DB `co_founder` usa o modo UI `founder`.

### 3.3 Homes oficiais

| Experiência                     | Home                      |
| ------------------------------- | ------------------------- |
| Cliente                         | `/app/habitacao/explorar` |
| Parceiro Patrimonial            | `/app/patrimonios`        |
| Agente Certificado              | `/app/agente`             |
| Prestador                       | `/app/servicos`           |
| Supervisor / Administrador      | `/app/admin`              |
| Superadministrador              | `/app/super`              |
| Founder                         | `/app/fundador`           |
| Cliente+Parceiro (default path) | `/app`                    |

### 3.4 Onde mudar a experiência

Menu da conta (canto da interface) -> seletor de experiência com os modos disponiveis para os papeis da sessao. Preferência em `localStorage`.

```
MODELO DE INTERFACE — exemplo conceptual
+----------------------------------+
| Conta · utilizador@dominio       |
| KYC n · UTS · ICK                |
|----------------------------------|
| Experiência activa:              |
|  (*) Cliente                     |
|  ( ) Parceiro Patrimonial        |
|  ( ) ...                         |
|----------------------------------|
| Centro de Confiança              |
| Centro de Segurança              |
| Perfil · Ajuda · Sair            |
+----------------------------------+
```

## 4. Hierarquia + KAI + papeis fora da cadeia

```
                 +-----------------------+
                 | Founder / Owner       |
                 | (+ Co-Founder)        |
                 +-----------+-----------+
                             |
                 +-----------v-----------+
                 | Superadministrador    |
                 +-----------+-----------+
                             |
                 +-----------v-----------+
                 | Administrador         |
                 +-----------+-----------+
                             |
                 +-----------v-----------+
                 | Supervisor            |
                 +--+--------+--------+--+
                    |        |        |
           +--------v--+ +---v----+ +-v----------+
           | Agente    | | PP     | | Prestador  |
           +-----+-----+ +---+----+ +-----+------+
                 |           |            |
                 +-----+-----+------+-----+
                       |
                 +-----v-----+
                 | Cliente   |
                 +-----------+

  [*] KAI = camada AI transversal (score preliminar na fila) -- NAO e papel humano
  [o] Board / Investor / Auditor -- sem ExperienceMode UI (branco/vermelho no cockpit)
      Auditor: permissões na BD apenas; consulta institucional fora da cadeia ops diaria
```

Matriz completa de permissões: `MATRIZ_PAPEIS_PERMISSOES_GOVERNANCA_v2.md`.

## 5. Ficha completa — CLIENTE 🟢

_Fonte: `role-operating-matrix.ts` + `nav.ts` + rotas reais + validação pós-deploy._

### 5.1 Missão oficial

Encontrar, arrendar ou comprar habitação e contratar serviços Kuteka.

### 5.2 Reporta a

Agente / Administração (suporte).

### 5.3 Home e CTAs

Home: `/app/habitacao/explorar`. CTAs: Centro de Confiança, Contratos, Serviços.

### 5.4 Menu real (nav.ts)

- Geral: Inicio `/app`, Mensagens, Futuro (habitação futura), Contratos, Confiança `/app/confianca`, Centro de Confiança, Centro de Segurança, Financeiro, Concierge, Assistencia, Serviços, Conta/Perfil.
- Cliente: Explorar, Residencia (`?vista=residencia`), Favoritos/Interesses (`?vista=interesses`), Visitas (`?vista=visitas`), Propostas (`/app/contratos`), Mudanca, Encontrar Casa, Garantia.
- Não ve: Patrimónios, Activar, Admin, Super, Fundador, Area do Agente (sem `agent.operate`).

### 5.5 Pode fazer (mustDo)

- Procurar e favoritar imóveis.
- Comentar, perguntar e partilhar na ficha.
- Pedir visitas e celebrar contratos.
- Avaliar imóvel, Parceiro, Agente e Prestador (onde a UI existir).

### 5.6 Não deve / não pode (mustNot + gates)

- Aprovar publicações.
- Gerir comissões da plataforma.
- Activar património de terceiros.
- Criar escalações operacionais (requer `properties.review`).

### 5.7 Rotas principais

`/app/habitacao/explorar`; vistas residencia/interesses/visitas; `/app/contratos`; `/app/servicos`; `/app/mudanca`; `/app/encontrar-casa`; `/app/concierge`; `/app/garantia`; `/app/assistencia`; `/app/mensagens`; `/app/centro-confianca`; `/app/centro-seguranca`; `/app/financeiro`; `/app/perfil`; `/app/confianca`.

### 5.8 Fluxo do dia (cockpitHint)

Feed → Favoritos → Visitas → Propostas → Contratos → Residencia

### 5.9 Património / habitação

Explora inventario publicado e janela premium. Não gere patrimónios alheios. Social na ficha 🟢.

### 5.10 Contratos

`/app/contratos` para propostas/contratos 🟢 (profundidade comercial continua a evoluir em Beta).

### 5.11 Confiança (KIS / KYC / UTS / ICK / Trust Center)

Completar identidade no Centro de Confiança. Menu mostra KYC / UTS / ICK. Gates de confiança afectam actos sensiveis.

### 5.12 Mensagens / chat

Listagem de conversas 🟢. `kuteka_chat_start_direct` Cliente↔PP/Agente frequentemente recusado sem contract/role pairing 🟡.

### 5.13 Social e avaliações

Gostar, favoritar, comentar, perguntar, partilhar, denunciar na ficha 🟢. Avaliações via PropertyReviews / marketplace em fluxos separados.

### 5.14 Financeiro e pagamentos

`/app/financeiro` superfície de utilizador 🟡. Kuteka Pay / dinheiro real parcial; sandbox em varios fluxos.

### 5.15 Serviços

Pedir serviços em `/app/servicos` (lado cliente) 🟡 — ciclo ponta-a-ponta não fechado no audit.

### 5.16 Como pedir ajuda / escalar

Ajuda `/app/ajuda`, documentação `/documentação`, Mensagens, contacto. Não usa EscalationPanel.

### 5.17 Limitações Beta honestas

Chat pairing 🟡; superfícies Mudanca/Concierge/Encontrar Casa podem estar incompletas; sem Board/Investor.

### 5.18 Checklist do primeiro dia

- Verificar email e sessao.
- Completar perfil.
- Abrir Centro de Confiança e iniciar KIS/KYC.
- Explorar o feed e favoritar pelo menos um imóvel.
- Pedir visita se aplicavel.
- Rever Contratos / Propostas.

### 5.19 Erros frequentes e o que fazer

- Sem permissão em `/app/patrimonios` → experiência Cliente sem `properties.manage` (esperado).
- Chat não inicia → pairing/contrato em falta 🟡.
- Imóvel não aparece no feed → pode estar em janela premium (so premium) ou ainda não publicado.

## 6. Ficha completa — PARCEIRO PATRIMONIAL 🟢

_Fonte: `role-operating-matrix.ts` + `nav.ts` + rotas reais + validação pós-deploy._

### 6.1 Missão oficial

Fornecer e gerir património através da Kuteka.

### 6.2 Reporta a

Supervisor / Admin (aprovacao e operação).

### 6.3 Home e CTAs

Primario: Activar património `/app/patrimonios/novo`. Lista `/app/patrimonios`. Confiança; Planos `/app/parceiro/planos`.

### 6.4 Menu real (nav.ts)

- Parceiro: Patrimónios, Activar, Relatórios (atalho `/app`), Planos.
- Geral: Inicio, Mensagens, Contratos, Confiança, Centros, Financeiro, Garantia, Serviços, Conta.
- Sem papel Cliente: não ve Explorar/Residencia/Favoritos/Visitas do grupo cliente. Com ambos os papeis use experiência Cliente+Parceiro.

### 6.5 Pode fazer (mustDo)

- Registar e activar património.
- Documentos, fotos, preco e localizacao (incl. GPS).
- Responder a pedidos e autorizar visitas.
- Celebrar contratos e acompanhar receitas (conforme UI disponível).

### 6.6 Não deve / não pode (mustNot + gates)

- Aprovar a própria publicacao.
- Gerir Admins.
- Alterar comissões da plataforma (so Founder via RPC/DB — sem UI).

### 6.7 Rotas principais

`/app/patrimonios`, `/app/patrimonios/novo`, `/app/parceiro/planos`, `/app/contratos`, `/app/confianca`, `/app/centro-confianca`, `/app/mensagens`, `/app/financeiro`, `/app/garantia`, `/app/servicos`, `/app/perfil`.

### 6.8 Fluxo do dia (cockpitHint)

Patrimónios → Ocupacao → Receitas → Contratos → PDK → Saude

### 6.9 Património / habitação

- Ciclo canónico (0038 + SPRINT_BETA_1_6): rascunho → submetido → em_analise_kai → em_analise_admin → pendente/correcoes → (apos approve) janela_premium → publicado → …
- Etapas posteriores (reservado/contrato/arrendado/utilizacao/…): 🟡/⚪ conforme automacao.
- Pós-deploy: Admin approve define `lifecycle_status = janela_premium` (~6h premium_visible / general_visible).
- PP corrige pendências; não decide approve/reject.

### 6.10 Contratos

Contratos em `/app/contratos`. Contratos de serviços Kuteka podem ser gerados no registo quando ha gestao/avaliação 🟡.

### 6.11 Confiança (KIS / KYC / UTS / ICK / Trust Center)

Motivo de pendencia real: `partner_identity_unconfirmed` — completar verificacao KIS/KYC no Centro de Confiança antes de republicar.

### 6.12 Mensagens / chat

Listagem 🟢; start_direct com Cliente pode exigir pairing 🟡. Ops contactam PP a partir da Central (Mensagens).

### 6.13 Social e avaliações

Ve interacções sociais nas fichas; responde perguntas quando o fluxo o permitir. Denuncias vao a moderacao.

### 6.14 Financeiro e pagamentos

Receitas/planos 🟡. Comissão 35% não e editavel pelo PP.

### 6.15 Serviços

Planos de parceiro + pedidos de remodelacao/obra no registo 🟡. Rede completa de prestadores 🔴/⚪.

### 6.16 Como pedir ajuda / escalar

Corrigir o que a pendencia indica; contactar ops via Mensagens/Ajuda. Supervisor/Admin contactam o PP.

### 6.17 Limitações Beta honestas

Publicacao gated por revisao; motor ICK A–G simplificado 🟡; metrica live de saude parcial; video/360 depende de upload.

### 6.18 Checklist do primeiro dia

- Completar KYC de Parceiro.
- Activar património com docs + >=5 fotos + fachada/rua + GPS valido.
- Submeter para analise.
- Acompanhar notificações de pendencia/correcao.
- Corrigir e resubmeter.
- Confirmar estado janela_premium / publicado apos aprovacao Admin.

### 6.19 Erros frequentes e o que fazer

- Pendencia: abrir notificacao e códigos de motivo (lista oficial na secção 9 / manual ops).
- Rejeicao Admin → lifecycle `arquivado`.
- Tentar auto-aprovar → impossivel (so Adminish).

## 7. Ficha completa — AGENTE CERTIFICADO 🟢 hub · 🟡 secções demo/parcial

_Fonte: `role-operating-matrix.ts` + `nav.ts` + rotas reais + validação pós-deploy._

### 7.1 Missão oficial

Executar operações no terreno — visitas, verificacao e acompanhamento.

### 7.2 Reporta a

Supervisor / Admin.

### 7.3 Home e CTAs

Home: `/app/agente`. CTAs: explorar habitação, contratos.

### 7.4 Menu real (nav.ts)

- Agente: Area do Agente `/app/agente`.
- Tambem: Explorar, Futuro, Contratos, Confiança, Centros, Mensagens, Financeiro, Concierge, Assistencia, Serviços, Conta.
- Itens Admin/Super/Fundador não aparecem sem permissões ops.

### 7.5 Pode fazer (mustDo)

- Visitar e inspecionar imóveis.
- Actualizar PDK e relatórios (conforme dados disponiveis).
- Acompanhar clientes e follow-up.
- Reportar irregularidades ao Supervisor.

### 7.6 Não deve / não pode (mustNot + gates)

- Aprovar publicações (bloqueado: `properties.review required`).
- Alterar comissões.
- Nomear Admins.

### 7.7 Rotas principais

`/app/agente` com ancoras: Agenda, Visitas, Imóveis, Clientes, Tarefas, Follow-up, Relatórios, Notificações; `/app/habitacao/explorar`; `/app/contratos`; mensagens; confiança; financeiro.

### 7.8 Fluxo do dia (cockpitHint)

Agenda → Visitas → Imóveis → Clientes → Tarefas → Follow-up → Relatórios

### 7.9 Património / habitação

Trabalha imóveis atribuídos. Pedido ops `request_technical_visit` → lifecycle `em_inspecao_técnica`. Pode abrir inventario habitacional.

### 7.10 Contratos

Acompanha `/app/contratos` 🟡 (mediação completa não fechada).

### 7.11 Confiança (KIS / KYC / UTS / ICK / Trust Center)

Credencial de agente no fluxo documental quando aplicavel; não decide revisao KYC institucional (`/app/confianca/revisao` e ops).

### 7.12 Mensagens / chat

Chat 🟡 (pairing). Contactar Cliente/PP quando permitido.

### 7.13 Social e avaliações

Pode usar exploracao/social no inventario; denuncia alimenta moderacao.

### 7.14 Financeiro e pagamentos

`/app/financeiro` superfície 🟡 — não gere Ledger/Super.

### 7.15 Serviços

Ve `/app/servicos` no menu; não e a inbox de Prestador.

### 7.16 Como pedir ajuda / escalar

Bloqueios → Supervisor. Atribuicao de agentes: `/app/admin/utilizadores` (ops).

### 7.17 Limitações Beta honestas

Hub existe 🟢; varias listas usam pipeline demo / assignments quando existem 🟡. Relatórios avancados 🟡.

### 7.18 Checklist do primeiro dia

- Confirmar experiência Agente Certificado.
- Abrir `/app/agente` e percorrer Agenda → Notificações.
- Rever imóveis atribuídos.
- Confirmar/abrir visitas.
- Registar follow-up.
- Escalar irregularidade ao Supervisor.

### 7.19 Erros frequentes e o que fazer

- Decidir publicacao → erro de permissão (esperado).
- Agenda vazia → sem `agent_assignments` (normal em conta nova/demo sem carga).

## 8. Ficha completa — PRESTADOR 🟡

_Fonte: `role-operating-matrix.ts` + `nav.ts` + rotas reais + validação pós-deploy._

### 8.1 Missão oficial

Executar serviços contratados através da Kuteka.

### 8.2 Reporta a

Admin / Super Admin (operação).

### 8.3 Home e CTAs

Home: `/app/servicos` (Area do Prestador). CTAs: Financeiro, Centro de Confiança.

### 8.4 Menu real (nav.ts)

- Item dedicado Serviços (grupo prestador) → `/app/servicos`.
- Tambem: Inicio, Mensagens, Contratos, Centros de Confiança/Segurança, Financeiro, Conta.
- Não ve menus de Activar património / Admin (sem perms).

### 8.5 Pode fazer (mustDo)

- Receber pedidos e enviar orçamentos.
- Aceitar, agendar e executar serviços.
- Enviar evidências e concluir.
- Acompanhar pagamento e avaliações (UI de fluxo mínimo).

### 8.6 Não deve / não pode (mustNot + gates)

- Aprovar patrimónios.
- Gerir Admins.
- Alterar comissões da plataforma.

### 8.7 Rotas principais

`/app/servicos`, `/app/financeiro`, `/app/centro-confianca`, `/app/centro-seguranca`, `/app/mensagens`, `/app/contratos`, `/app/perfil`.

### 8.8 Fluxo do dia (cockpitHint)

Pedido → Orçamento → Aceite → Servico → Agenda → Evidências → Conclusão → Pagamento → Avaliação

### 8.9 Património / habitação

Não gere publicacao de património. Pode participar em remodelacao quando existir pedido 🟡.

### 8.10 Contratos

Ligacao marketplace / contratos de servico 🟡.

### 8.11 Confiança (KIS / KYC / UTS / ICK / Trust Center)

Completar Centro de Confiança para elegibilidade a trabalhos sensiveis.

### 8.12 Mensagens / chat

Mensagens com Cliente para confirmar agenda 🟡.

### 8.13 Social e avaliações

Avaliação no fecho do fluxo; reviews marketplace separados da barra social da ficha de imóvel.

### 8.14 Financeiro e pagamentos

Pagamento em `/app/financeiro` 🟡; Kuteka Pay real parcial.

### 8.15 Serviços

Inbox provider em `/app/servicos` com passos do fluxo visiveis 🟡. Criacao ponta-a-ponta de pedido não exercitada no pós-deploy sob nomes `marketplace_create_order`.

### 8.16 Como pedir ajuda / escalar

Problemas de execucao → Admin/Super via suporte/Mensagens. Não cria escalacao formal de publicacao.

### 8.17 Limitações Beta honestas

Tratar ciclo Pedido→Pagamento como Beta parcial ate validação ponta-a-ponta.

### 8.18 Checklist do primeiro dia

- Login com papel Prestador.
- Abrir `/app/servicos` e confirmar Area do Prestador.
- Rever inbox / pedidos.
- Responder orçamento e aceitar.
- Confirmar agenda em Mensagens.
- Carregar evidências → concluir → pagamento → avaliação.

### 8.19 Erros frequentes e o que fazer

- Sem pedidos → marketplace vazio ou conta nova (esperado).
- Abrir `/app/admin` → Forbidden sem `admin.panel` / `properties.review`.

## 8A. Wireframes das homes de utilizador

```
MODELO DE INTERFACE — exemplo conceptual
CLIENTE — /app/habitacao/explorar
+----------------------------------------------------------------+
| KUTEKA | Explorar | Residencia | Favoritos | Visitas | ...     |
|----------------------------------------------------------------|
| Feed de habitação (full-bleed cards de inventario)             |
| [Filtros]  [Disponibilidade futura]                            |
| Imóvel A   Imóvel B   Imóvel C                                 |
| CTA: ver ficha → social (Gostar|Favoritar|Comentar|Perguntar)  |
+----------------------------------------------------------------+
```

```
MODELO DE INTERFACE — exemplo conceptual
PARCEIRO — /app/patrimonios
+----------------------------------------------------------------+
| Patrimónios | Activar | Planos | Contratos | Confiança         |
|----------------------------------------------------------------|
| [ Activar património ]                                         |
| Lista: código | título | lifecycle_status | acções             |
| Painel PDK / Saude (na ficha)                                  |
+----------------------------------------------------------------+
```

```
MODELO DE INTERFACE — exemplo conceptual
AGENTE — /app/agente
+----------------------------------------------------------------+
| Area do Agente                                                 |
| 1 Agenda 2 Visitas 3 Imóveis 4 Clientes                        |
| 5 Tarefas 6 Follow-up 7 Relatórios 8 Notificações              |
|----------------------------------------------------------------|
| Secção activa: lista / atalhos / demo pipeline quando vazio    |
+----------------------------------------------------------------+
```

```
MODELO DE INTERFACE — exemplo conceptual
PRESTADOR — /app/servicos
+----------------------------------------------------------------+
| Area do Prestador                                              |
| Pedido → Orçamento → Aceite → Servico → Agenda →               |
| Evidências → Conclusão → Pagamento → Avaliação                 |
|----------------------------------------------------------------|
| Inbox de pedidos | detalhe | acções do passo actual            |
+----------------------------------------------------------------+
```

## 9. Jornada do Cliente (ponta a ponta)

Estado geral do percurso comercial longo: 🟢 explorar/social/visitas/contratos básicos · 🟡 negociação profunda / pay real / chat pairing.

```
Interessados → Visitas → Propostas → Negociacao → Contrato
    → Mudanca → Ocupacao → Renovacao
(trechos finais 🟡/⚪ conforme modulo)
```

### 9.1 Passo a passo operacional

- Entrar e escolher experiência Cliente.
- Completar Centro de Confiança (KIS→KYC).
- Explorar `/app/habitacao/explorar`; usar Futuro se quiser disponibilidade futura.
- Na ficha: Gostar / Favoritar / Comentar / Perguntar / Partilhar / Denunciar 🟢.
- Guardar interesses (`?vista=interesses`) e gerir visitas (`?vista=visitas`).
- Abrir propostas/contratos em `/app/contratos`.
- Residencia (`?vista=residencia`) apos ocupação.
- Serviços opcionais `/app/servicos`; Mudanca / Concierge / Garantia / Assistencia conforme necessidade 🟡.

### 9.2 O que o Cliente ve na ficha (social) 🟢

Barra imediatamente abaixo da galeria: Gostar | Favoritar | Comentarios | Perguntar | Partilhar. Paineis expansíveis (não páginas novas). Partilha: WhatsApp, copiar link, Web Share.

## 10. Capitulo do Agente — operação de terreno

Hub `/app/agente` 🟢 com oito blocos. Conteudo pode misturar assignments reais e demonstração 🟡.

### 10.1 Sequencia do dia

- Agenda: compromissos derivados de atribuições.
- Visitas: abrir vista de visitas habitação ou detalhe do imóvel.
- Imóveis atribuídos: priorizar contacto / visita / follow-up.
- Clientes: acompanhamento dos interessados ligados.
- Tarefas e Follow-up: fechar pendentes do dia.
- Relatórios / Notificações: fecho e alertas.

### 10.2 Relacao com publicacao

Quando ops pedem visita técnica, o imóvel fica `em_inspecao_técnica`. O Agente executa no terreno e reporta; **nao** aprova. Motivo tipico: `technical_visit_needed` / `fraud_suspicion`.

### 10.3 Wireframe visita

```
MODELO DE INTERFACE — exemplo conceptual
+--------------------------------------------------+
| Visita técnica · imóvel CODE-123                 |
| Estado lifecycle: em_inspecao_técnica            |
|--------------------------------------------------|
| Checklist: fachada | interiores | docs | GPS     |
| Notas do agente                                  |
| [ Guardar ]  [ Reportar irregularidade → Supv ]  |
+--------------------------------------------------+
(Conceitual — use as secções reais do hub + ficha do imóvel)
```

## 11. Capitulo do Prestador

UI `/app/servicos` em modo provider mostra a missão e a cadeia de passos 🟡.

### 11.1 Papel em cada passo

| Passo            | Quem age                          | Estado |
| ---------------- | --------------------------------- | ------ |
| Pedido           | Cliente (ou ops) cria necessidade | 🟡     |
| Orçamento        | Prestador responde                | 🟡     |
| Aceite           | Cliente/fluxo confirma            | 🟡     |
| Servico / Agenda | Prestador + Cliente (Mensagens)   | 🟡     |
| Evidências       | Prestador carrega prova           | 🟡     |
| Conclusão        | Prestador fecha                   | 🟡     |
| Pagamento        | Financeiro / Pay parcial          | 🟡     |
| Avaliação        | Cliente avalia Prestador          | 🟡     |

Não confundir com aprovacao de património (ops) nem com comissão 35% (Founder RPC).

## 12. Confiança: KIS → KYC → UTS → ICK → Trust Center 🟢/🟡

### 12.1 Mapa

```
KIS (identidade) --> KYC (niveis 0..4) --> UTS (score utilizador)
                                      \-> documentos Trust
Parceiro / imóvel ----------------------> ICK (score patrimonial) 🟡 motor
Tudo converge no Centro de Confiança `/app/centro-confianca`
Revisão ops: `/app/confianca/revisao` (Supervisor/Admin/...)
Página legado/atalho: `/app/confianca`
```

### 12.2 O que fazer como utilizador

- Abrir `/app/centro-confianca` e seguir próximos passos mostrados.
- Submeter documentos de identidade / morada / título (conforme pedido).
- Aguardar revisao ops quando status pending/under_review.
- PP: identidade não confirmada bloqueia publicacao limpa (`partner_identity_unconfirmed`).

### 12.3 Centro de Segurança

`/app/centro-seguranca` — email/telefone, sessões, score de segurança. Identidade institucional permanente e o `user_id` (importante se alguma vez for promovido).

```
MODELO DE INTERFACE — exemplo conceptual
+--------------------------------------------------+
| Centro de Confiança                              |
| KYC nivel n | UTS xx | ICK yy (se PP)            |
|--------------------------------------------------|
| Próximos passos                                  |
| [ Enviar documento ] [ Actualizar dados ]        |
| Histórico de submissoes                          |
+--------------------------------------------------+
```

## 13. Comúnicacao 🟡

- Mensagens: `/app/mensagens` — listagem e unread 🟢.
- Iniciar conversa directa: muitas vezes exige contract ou role pairing 🟡 — documentado como parcial.
- Contactar PP a partir da Central de Trabalho (ops) usa o mesmo canal de mensagens.
- Notificações shell existem (catálogo + eventos); push/inbox dedicado não e produto completo 🟡.
- Ajuda: `/app/ajuda` e `/documentação`.

## 14. Serviços — fluxos com papel em cada passo

### 14.1 Marketplace generico

Cliente pede → Prestador orçamento/executa → avaliação. Estado 🟡.

### 14.2 Serviços na activacao de património (PP)

No Activar Património o PP indica serviços pretendidos / nivel de gestao. Pode gerar contrato de serviços Kuteka e exigir avaliação (`em_avaliação`) 🟡.

### 14.3 Planos de parceiro

`/app/parceiro/planos` 🟢 rota; profundidade comercial 🟡.

### 14.4 Quem não intervem

Cliente não aprova património. Prestador não aprova património. Agente não aprova. Comissão so Founder (RPC).

## 15. Checklists do primeiro dia (resumo)

| Papel     | Top 5                                                                  |
| --------- | ---------------------------------------------------------------------- |
| Cliente   | Email → Perfil → Confiança → Explorar → Favoritar                      |
| PP        | KYC → Activar completo → Submeter → Notificações → Corrigir pendências |
| Agente    | Experiência Agente → Hub → Atribuições → Visitas → Follow-up           |
| Prestador | Experiência Prestador → `/app/servicos` → Inbox → Orçamento → Agenda   |

## 16. Onde vejo X? (respostas rapidas)

| Quero ver…                   | Onde                              |
| ---------------------------- | --------------------------------- |
| Meu papel / experiência      | Menu da conta → seletor           |
| Habitação / feed             | `/app/habitacao/explorar`         |
| Favoritos                    | `/app/habitacao?vista=interesses` |
| Visitas                      | `/app/habitacao?vista=visitas`    |
| Residencia                   | `/app/habitacao?vista=residencia` |
| Meus patrimónios             | `/app/patrimonios`                |
| Activar imóvel               | `/app/patrimonios/novo`           |
| Planos PP                    | `/app/parceiro/planos`            |
| Area Agente                  | `/app/agente`                     |
| Area Prestador               | `/app/servicos` (modo provider)   |
| Contratos / propostas        | `/app/contratos`                  |
| Mensagens                    | `/app/mensagens`                  |
| Confiança / KYC              | `/app/centro-confianca`           |
| Segurança da conta           | `/app/centro-seguranca`           |
| Financeiro                   | `/app/financeiro`                 |
| Perfil                       | `/app/perfil`                     |
| Ajuda                        | `/app/ajuda`                      |
| Docs publicas                | `/documentação`                   |
| Central ops (se for ops)     | `/app/admin`                      |
| Super (se for Super/Founder) | `/app/super`                      |
| Founder Center               | `/app/fundador`                   |
| Comissão 35% UI              | 🔴 não existe — Founder RPC/DB    |
| Board / Investor dashboard   | 🔴/⚪ sem ExperienceMode          |

## 17. Ciclo de vida do imóvel (referência partilhada)

```
rascunho → submetido → em_analise_kai → em_analise_admin
  → pendente | correcoes | em_analise_documental | em_inspecao_técnica | em_preparacao
  → (Adminish approve) janela_premium 🟢 validado pós-deploy
  → publicado (apos janela ~6h / promote_premium_window_properties)
  → reservado / contrato / arrendado|vendido / em_utilizacao
  → libertacao_prevista / disponível_novamente / em_manutencao / ...
  → arquivado (reject)
Etapas tardias: 🟡 automacao parcial · ⚪ planeado aprofundar v1.1+
```

### 17.1 Motivos oficiais de pendencia (labels 0036)

| code                             | label_pt                                          |
| -------------------------------- | ------------------------------------------------- |
| `partner_identity_unconfirmed`   | Identidade do Parceiro Patrimonial não confirmada |
| `property_document_insufficient` | Documento do imóvel insuficiente                  |
| `not_in_advertiser_name`         | Imóvel não esta em nome do anunciante             |
| `photos_insufficient`            | Fotografias insuficientes                         |
| `no_facade_photos`               | Não existem fotografias da fachada                |
| `no_street_photos`               | Não existem fotografias da rua                    |
| `address_inconsistent`           | Endereço inconsistente                            |
| `gps_invalid`                    | GPS invalido                                      |
| `contradictory_info`             | Informação contraditória                          |
| `fraud_suspicion`                | Suspeita de fraude                                |
| `technical_visit_needed`         | Visita técnica necessária                         |
| `additional_docs`                | Documentação adicional necessária                 |

Tutorial completo de pendencia/aprovacao: manual operacional administrativo.

## 18. Cliente + Parceiro na mesma conta 🟢

Se tem ambos os papeis DB, a experiência `client_partner` fica disponível. Missão: usar Kuteka como Cliente e como Parceiro. MustNot: aprovar publicações institucionais; alterar governação. Cockpit: modo integrado.

## 19. Glossario mínimo

| Termo          | Significado curto                                          |
| -------------- | ---------------------------------------------------------- |
| ExperienceMode | Lens de UI por papel                                       |
| MODE_LENS      | Permissões expostas por experiência                        |
| PDK            | Passaporte Digital Kuteka do imóvel                        |
| KAI            | Camada AI transversal (score preliminar)                   |
| KIS            | Identidade / identidade Kuteka                             |
| KYC            | Know Your Customer (niveis)                                |
| UTS            | Score de confiança do utilizador                           |
| ICK            | Score/confiança patrimonial                                |
| KOCC           | Centro operacional/comando (Super/Founder)                 |
| Janela premium | ~6h apos approve antes do feed geral                       |
| Adminish       | Founder/Owner/Admin/Super/Co-Founder (pode approve/reject) |

## 20. Fontes de verdade

- `apps/web/modules/shell/role-experience.ts`
- `apps/web/modules/shell/role-operating-matrix.ts`
- `apps/web/modules/shell/nav.ts`
- `apps/web/modules/administração/services/publication-review-client.ts`
- SQL `0036` `0038` `0039` `0040`
- `docs/product/ROLE_OPERATING_VALIDATION_POST_DEPLOY.md`
- `docs/product/SPRINT_BETA_1_6.md`
- `docs/product/MANUAL_PLATFORM_AUDIT_SNAP_2026-08-09.md`

Fim do Manual Completo do Utilizador v2.

## Apêndice A — Procedimentos passo a passo (utilizador)

### A.1 Favoritar e perguntar num imóvel 🟢

1. Abrir `/app/habitacao/explorar` e entrar na ficha.
2. Na barra **abaixo das fotos**: tocar **Favoritar** (passa a «Remover favorito»).
3. Tocar **Perguntar**, escrever a pergunta, enviar.
4. Opcional: **Comentar**, **Partilhar** (WhatsApp / copiar link / Web Share), **Denunciar**.
5. Confirmar em `/app/habitacao?vista=interesses` que o favorito aparece.

### A.2 Pedir visita (Cliente) 🟢/🟡

1. Na ficha ou em Visitas, iniciar pedido de visita conforme UI disponível.
2. Acompanhar em `/app/habitacao?vista=visitas`.
3. Se o chat directo falhar com «contract or role pairing required», usar o canal que a plataforma oferecer após interesse/contrato 🟡.

### A.3 Activar património (PP) — checklist de qualidade antes de submeter 🟢

1. `/app/patrimonios/novo`.
2. Preencher morada, comuna/bairro, GPS no mapa.
3. Carregar documento de propriedade (ou equivalente).
4. Mínimo 5 fotografias + fachada + rua.
5. Preço, tipologia, áreas sem contradições.
6. Serviços Kuteka / nível de gestão (se aplicável).
7. Submeter e anotar o código do imóvel.
8. Abrir Centro de Confiança se identidade PP incompleta.

### A.4 Responder a pendência (PP) 🟢

1. Ler notificação (título «Publicação em pendência» / correcções / documentos / visita).
2. Identificar `pending_reason_codes` e soluções (`solution_pt`).
3. Corrigir na ficha do património.
4. Republicar/resubmeter conforme fluxo.
5. Aguardar nova análise (não tentar auto-aprovar).

### A.5 Dia do Agente (mínimo) 🟡/🟢

1. `/app/agente` → percorrer âncoras 1–8.
2. Em Imóveis atribuídos, abrir ficha e planear visita.
3. Usar vista `/app/habitacao?vista=visitas` se útil.
4. Follow-up e reportar irregularidade ao Supervisor (Mensagens / processo ops).

### A.6 Dia do Prestador (mínimo) 🟡

1. `/app/servicos` — confirmar «Área do Prestador».
2. Abrir pedido → orçamento → aceite.
3. Confirmar agenda em `/app/mensagens`.
4. Evidências → conclusão → pagamento → avaliação.

---

## Apêndice B — Tabela «O que acontece se…»

| Situação                          | Resultado esperado                          | Estado      |
| --------------------------------- | ------------------------------------------- | ----------- |
| Cliente abre `/app/admin`         | Forbidden / sem menu                        | 🟢          |
| PP tenta aprovar o próprio imóvel | Sem decisão adminish                        | 🟢          |
| Agente chama decide publication   | `properties.review required`                | 🟢          |
| Supervisor aprova                 | `administrator required for approve/reject` | 🟢          |
| Admin aprova                      | `janela_premium` ~6h                        | 🟢          |
| Admin rejeita                     | `arquivado`                                 | 🟢          |
| Cliente start_direct sem pairing  | Recusa pairing                              | 🟡          |
| Demo claim Founder                | Bloqueado                                   | 🟢          |
| Prestador sem pedidos             | Inbox vazia                                 | 🟡 esperado |

---

## Apêndice C — Mapa mental Cliente

```
Explorar ──► Ficha ──► Social (🟢)
   │            │
   │            ├── Visita ──► Proposta ──► Contrato (🟢/🟡)
   │            └── Pergunta / Mensagem (🟡 pairing)
   ├── Favoritos / Interesses
   ├── Residência (após ocupação)
   └── Serviços / Mudança / Concierge (🟡)
Confiança ──► KYC/UTS ──► gates
Segurança ──► email/sessões
```

---

## Apêndice D — Mapa mental Parceiro

```
Activar ──► Submeter ──► Fila ops
                │
                ├── Pendência ──► Corrigir ──► Reanálise
                ├── Visita técnica (Agente)
                └── Approve ──► Janela premium ──► Publicado
PDK / Saúde / Planos / Contratos / Receitas (🟡 profundidade)
```

---

## Apêndice E — Contactos e ajuda

| Canal        | Rota / valor                                |
| ------------ | ------------------------------------------- |
| Ajuda na app | `/app/ajuda`                                |
| Documentação | `/documentacao`                             |
| Mensagens    | `/app/mensagens`                            |
| Produção     | https://kutekalink.com                      |
| Manuais ops  | `MANUAL_OPERACIONAL_ADMINISTRATIVO_v2.md`   |
| Matriz       | `MATRIZ_PAPEIS_PERMISSOES_GOVERNANCA_v2.md` |

---

_Documento gerado para operação real Kuteka Beta — alinhado ao snap de auditoria 2026-08-09._
