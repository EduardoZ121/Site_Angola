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
    → Validação
    → Aprovação Final
    → Próxima Fase
```

## Regras

1. Sem implementação antes de especificação aprovada.
2. Sem alteração estrutural da arquitectura base sem justificação clara (segurança, desempenho, escalabilidade ou manutenção).
3. Documentação evolui com o código:
   - decisões arquitecturais → ADR (actualizar ou criar);
   - alterações funcionais → spec / PRD correspondente.
4. Propor melhorias significativas **antes** de implementar; evitar retrabalho cosmético.
5. Backlog P0 (`docs/backlog/P0_PRE_AUTH.md`) bloqueia Auth de produto até conclusão.

## Referências

- `docs/AI_CONTEXT.md`
- `docs/architecture/ADR-001-foundation-architecture-decisions.md`
- `docs/backlog/P0_PRE_AUTH.md`
