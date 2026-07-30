# Processo Oficial de Desenvolvimento — Kuteka

**Estado:** Activo  
**Aprovado:** Encerramento FASE 1 (2026-07-29)  
**Actualização:** 2026-07-30 — Escala de maturidade N1–N5 + factores se confiança < 95%

## Ciclo padrão (todos os módulos)

```
Especificação
    → Aprovação
    → Implementação
    → Auto-Revisão Técnica
    → Testes
    → Validação funcional e visual
    → Aprovação Final / Encerramento
    → Próxima Fase
```

### Quatro níveis obrigatórios para encerrar um módulo

1. Implementação concluída
2. Auto-revisão técnica concluída
3. Testes concluídos
4. Validação funcional e visual aprovada

Só após os quatro o módulo está oficialmente encerrado.

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
| Metodológica  | Este processo; sem implementação antes de aprovação            |

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

| Nível  | Nome                      | Significado                                                      |
| ------ | ------------------------- | ---------------------------------------------------------------- |
| **N1** | Rascunho                  | Ideia inicial; incompleto; não pronto para revisão formal        |
| **N2** | Em revisão                | Em elaboração / iteração activa com a equipa                     |
| **N3** | Candidato                 | Auto-revisado; apresentado para aprovação do PO                  |
| **N4** | Pronto para implementação | Spec aprovada; gate de implementação cumprido (quando aplicável) |
| **N5** | Implementado e validado   | Código entregue + 4 níveis de encerramento cumpridos             |

Usar esta classificação em conjunto com a percentagem de confiança em todas as Autoavaliações.

### Autoavaliação do Arquitecto (obrigatória ao fechar um bloco importante)

Sempre que um bloco relevante de especificação / PRD / ADR de produto for concluído ou apresentado como candidata final, incluir secção **«Autoavaliação do Arquitecto»** com:

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
- **escolha estratégica** que dependa do PO.

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
| Decisões aprovadas                  | Ex.: D1–D12 e F1–F6 no PRD-001                         |
| Este processo                       | Este ficheiro                                          |

---

## Regras

1. Sem implementação antes de especificação aprovada.
2. Sem alteração estrutural da arquitectura base sem justificação clara (segurança, desempenho, escalabilidade ou manutenção).
3. Documentação evolui com o código:
   - decisões arquitecturais → ADR (actualizar ou criar);
   - alterações funcionais → spec / PRD correspondente;
   - backlog técnico organizado.
4. Propor melhorias significativas **antes** de implementar; evitar retrabalho cosmético.
5. Pendências infra P0 (CI, migration `0002`) e domínio são ops — não bloqueiam especificação; **bloqueiam implementação** do PRD-001 até gate.
6. A metodologia global está madura; alterações ao processo só por decisão explícita do PO (como as de 2026-07-30).

## Referências

- `docs/AI_CONTEXT.md`
- `docs/architecture/ADR-001-foundation-architecture-decisions.md`
- `docs/backlog/PHASE_GATE_BEFORE_PRD001.md`
- `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md`
