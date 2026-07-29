# Processo Oficial de Desenvolvimento — Kuteka

**Estado:** Activo  
**Aprovado:** Encerramento FASE 1 (2026-07-29)

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

## Regras

1. Sem implementação antes de especificação aprovada.
2. Sem alteração estrutural da arquitectura base sem justificação clara (segurança, desempenho, escalabilidade ou manutenção).
3. Documentação evolui com o código:
   - decisões arquitecturais → ADR (actualizar ou criar);
   - alterações funcionais → spec / PRD correspondente;
   - backlog técnico organizado.
4. Propor melhorias significativas **antes** de implementar; evitar retrabalho cosmético.
5. Backlog P0 (`docs/backlog/P0_PRE_AUTH.md`) bloqueia Auth de produto até conclusão.
6. **Estabilidade do processo:** a metodologia e regras globais estão maduras — o foco passa a ser a qualidade de cada módulo, sem alterar continuamente o processo global.

## Referências

- `docs/AI_CONTEXT.md`
- `docs/architecture/ADR-001-foundation-architecture-decisions.md`
- `docs/backlog/P0_PRE_AUTH.md`
