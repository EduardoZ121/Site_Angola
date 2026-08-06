# Module: mensagens — Chat Kuteka MVP (Sprint Beta 1.5)

Domínio KEOS — mensagens directas entre contas Kuteka, dentro da plataforma.

Ref: [docs/product/SPRINT_BETA_1_5.md](../../../../docs/product/SPRINT_BETA_1_5.md) ·
migration [`0033_kuteka_chat_trust.sql`](../../../../supabase/migrations/0033_kuteka_chat_trust.sql).

## Regras de negócio (PO)

- O ícone junto às notificações abre a caixa de entrada (`MessagesTopbarButton`).
- Conversas: lista, não lidas, pesquisa, estado Activa/Arquivada/Concluída.
- Pares permitidos: Cliente↔Parceiro, Cliente↔Agente, Parceiro↔Agente,
  Parceiro↔Admin, Prestador↔Cliente (só com serviço contratado),
  Prestador↔Parceiro, Admin↔qualquer, SuperAdmin↔qualquer.
- Telefone/email **nunca** aparecem por defeito — a comunicação fica na
  Kuteka até existir contrato, visita agendada, ou autorização explícita.

## Estrutura

- `content/` — cópia pt/en/fr/es (`getMensagensCopy`).
- `services/chat-client.ts` — wrapper fino sobre as RPCs `kuteka_chat_*`.
- `components/MessagesInboxClient.tsx` — página completa: pesquisa, lista,
  thread, compositor, chips de estado.
- `components/MessagesTopbarButton.tsx` — ícone + badge de não lidas, ligado
  em `TopbarActions.tsx` antes das notificações.
- `components/MessagePropertyOwnerButton.tsx` — CTA secundário "Mensagem" em
  páginas de detalhe de património (best-effort, soft-fail).
- `lib/contact-policy.ts` — regras puras (sem framework) sobre quando os
  contactos podem ser libertados e que pares de papéis são permitidos —
  usado só para copy/UI; a RPC + RLS no Supabase são a fonte de verdade.

## Fora de escopo desta fase

Reputação/Confiança avançada (avaliações ligadas a uma conversa), partilha
de anexos/imagens, notificações push/email de novas mensagens. Ver
comentário no topo da migration `0033` para o racional.
