# Processo Oficial de Desenvolvimento — Kuteka

**Estado:** Activo  
**Aprovado:** Encerramento FASE 1 (2026-07-29)  
**Actualização:** 2026-07-30 — Duas fases obrigatórias por PRD (Aprovação Funcional ≠ Autorização de Implementação)

## Ciclo padrão (todos os módulos)

```
Especificação
    → Aprovação Funcional          ← documento torna-se referência oficial
    → Engineering Gate             ← prontidão técnica
    → Autorização de Implementação ← PO explícito
    → Implementação
    → Auto-Revisão Técnica
    → Testes
    → Validação funcional e visual
    → Aprovação Final / Encerramento
    → Próxima Fase
```

### Quatro níveis obrigatórios para encerrar um módulo (após implementação)

1. Implementação concluída
2. Auto-revisão técnica concluída
3. Testes concluídos
4. Validação funcional e visual aprovada

Só após os quatro o módulo está oficialmente encerrado (**N5**).

---

## Duas fases obrigatórias de todo PRD Kuteka

A partir de 2026-07-30, **todos** os PRDs seguem duas fases distintas. Aprovação funcional **não** autoriza código.

### Fase 1 — Aprovação Funcional

Confirma que:

1. Os requisitos de negócio estão completos
2. Os fluxos estão aprovados
3. Os casos limite estão documentados
4. Os critérios de aceitação estão definidos
5. O documento passa a ser a **referência oficial** do módulo

Alterações posteriores = **revisões controladas** do PRD (com rastreabilidade).

### Fase 2 — Autorização de Implementação

Só pode ocorrer quando:

1. O **Engineering Gate** do módulo estiver concluído e aprovado
2. Os pré-requisitos técnicos estiverem satisfeitos
3. A infraestrutura necessária estiver disponível
4. Existir **autorização explícita** do Product Owner

Até à Fase 2: **nenhuma implementação** do módulo.

### Relação com a escala N1–N5

| Momento                                                  | Maturidade típica                   |
| -------------------------------------------------------- | ----------------------------------- |
| Em elaboração / candidata                                | N1–N3                               |
| Após **Aprovação Funcional**                             | Documento oficial; ainda **não N4** |
| Após Engineering Gate + **Autorização de Implementação** | **N4**                              |
| Após 4 níveis de encerramento                            | **N5**                              |

---

## Papel: Arquitecto Principal e Guardião da Consistência

A partir de 2026-07-30, o agente de desenvolvimento actua como **Arquitecto Principal e Guardião da Consistência da Kuteka**.

É responsável por verificar continuamente, **sem aguardar instrução explícita**:

| Dimensão      | Foco                                                           |
| ------------- | -------------------------------------------------------------- |
| Funcional     | Fluxos, casos limite, critérios de aceitação                   |
| Arquitectural | ADR-001+, monorepo, multi-papel, API-first, RBAC/audit         |
| Experiência   | PASSO 0, simplicidade/confiança/controlo, narrativa auth F1–F6 |
| Visual        | Design System Nº 003 / `@kuteka/ui` (quando aplicável)         |
| Documental    | Specs, PRDs, ADRs, backlog alinhados                           |
| Metodológica  | Este processo; sem implementação antes da Fase 2               |

### Ciclo antes de apresentar qualquer proposta

1. Análise dos documentos oficiais Kuteka
2. Produção da proposta
3. Auto-revisão crítica
4. Identificação de inconsistências
5. Correção das inconsistências
6. Apresentação da **versão candidata** à aprovação

### O que cada versão candidata deve declarar

1. Documentos consultados
2. Verificações realizadas
3. Conflitos / ambiguidades encontrados
4. Como foram resolvidos (e fundamento)
5. Nível de confiança de alinhamento com a visão Kuteka
6. Nível de maturidade (escala abaixo)

### Escala de maturidade (uniforme — PRDs, ADRs, docs importantes)

| Nível  | Nome                      | Significado                                                                   |
| ------ | ------------------------- | ----------------------------------------------------------------------------- |
| **N1** | Rascunho                  | Ideia inicial; incompleto; não pronto para revisão formal                     |
| **N2** | Em revisão                | Em elaboração / iteração activa com a equipa                                  |
| **N3** | Candidato                 | Auto-revisado; apresentado para aprovação do PO                               |
| **N4** | Pronto para implementação | **Aprovação Funcional** + Engineering Gate + **Autorização de Implementação** |
| **N5** | Implementado e validado   | Código entregue + 4 níveis de encerramento cumpridos                          |

Usar esta classificação em conjunto com a percentagem de confiança em todas as Autoavaliações.

### Autoavaliação do Arquitecto (obrigatória ao fechar um bloco importante)

Sempre que um bloco relevante de especificação / PRD / ADR / Engineering Gate for concluído ou apresentado como candidata final, incluir secção **«Autoavaliação do Arquitecto»** com:

| Campo                           | Conteúdo                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Nível de maturidade             | N1–N5 (escala acima)                                                                              |
| Nível de confiança              | Percentagem (0–100%)                                                                              |
| Factores < 95%                  | **Obrigatório se confiança < 95%:** listar explicitamente o que impede ≥95% (sem inflacionar a %) |
| Principais riscos remanescentes | Lista curta e concreta                                                                            |
| Dívidas técnicas ou documentais | Lacunas conhecidas (ex.: docs não versionados)                                                    |
| Decisões adiadas                | O que fica para fases futuras (e porquê)                                                          |
| Recomendação                    | **Aprovar** · **Aprovar com reservas** · **Não aprovar**                                          |

Regras:

1. A autoavaliação faz parte do processo normal — não é opcional.
2. **Não** aumentar artificialmente a percentagem de confiança.
3. Se confiança < 95%, os factores devem ser específicos e verificáveis.

### Quando pedir intervenção do Product Owner

Apenas quando existir:

- verdadeira **decisão de negócio**;
- **conflito** entre requisitos oficiais;
- **escolha estratégica** que dependa do PO;
- **Autorização de Implementação** (Fase 2).

Caso contrário: analisar, propor a melhor solução, fundamentar com documentos/decisões, e apresentar já corrigido.

### Documentos oficiais a confrontar (mínimo)

| Documento                           | Local / nota                                           |
| ----------------------------------- | ------------------------------------------------------ |
| Manual Operacional                  | Hierarquia AI_CONTEXT (fonte externa se não no repo)   |
| Software Architecture Blueprint     | Hierarquia AI_CONTEXT                                  |
| Identidade Oficial                  | `docs/proposals/PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`  |
| UX Blueprint / Design System Nº 003 | Referenciados; DS parcial em `@kuteka/ui` + AI_CONTEXT |
| AI_CONTEXT                          | `docs/AI_CONTEXT.md`                                   |
| ADRs                                | `docs/architecture/`                                   |
| PRDs / specs                        | `docs/proposals/`                                      |
| Engineering Gates                   | `docs/backlog/*_ENGINEERING_GATE.md`                   |
| Decisões aprovadas                  | Ex.: D1–D12 e F1–F6 no PRD-001                         |
| Este processo                       | Este ficheiro                                          |

---

## Regras

1. Sem implementação antes da **Autorização de Implementação** (Fase 2).
2. Aprovação Funcional (Fase 1) torna o PRD referência oficial, mas **não** autoriza código.
3. Sem alteração estrutural da arquitectura base sem justificação clara (segurança, desempenho, escalabilidade ou manutenção).
4. Documentação evolui com o código:
   - decisões arquitecturais → ADR (actualizar ou criar);
   - alterações funcionais → revisão controlada do PRD;
   - backlog técnico organizado.
5. Propor melhorias significativas **antes** de implementar; evitar retrabalho cosmético.
6. Pendências de Engineering Gate são ops/técnicas — **bloqueiam** Autorização de Implementação.
7. A metodologia global está madura; alterações ao processo só por decisão explícita do PO.

## Referências

- `docs/AI_CONTEXT.md`
- `docs/architecture/ADR-001-foundation-architecture-decisions.md`
- `docs/backlog/PHASE_GATE_BEFORE_PRD001.md`
- `docs/backlog/PRD_001_ENGINEERING_GATE.md`
- `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`
