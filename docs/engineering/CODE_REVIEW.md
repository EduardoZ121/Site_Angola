# Code Review Checklist (KEOS)

- [ ] Alinhado ao Blueprint / ADR-001 / AI_CONTEXT
- [ ] Sem regras de negócio no Design System (`@kuteka/ui`)
- [ ] Autorização por permissão (`canX`), não `role === …` no cliente
- [ ] Sem secrets no código
- [ ] TypeScript strict sem `any` injustificado
- [ ] Logs sem PII / tokens
- [ ] Testes para lógica crítica (RBAC, validation, utils)
- [ ] Conventional Commit na mensagem
