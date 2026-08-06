import { z } from 'zod';

export const CHAT_CONTEXT_TYPES = [
  'property',
  'contract',
  'service',
  'general',
  'admin',
  'interest',
] as const;

export const CHAT_CONVERSATION_STATUSES = ['active', 'archived', 'completed'] as const;

export const CHAT_MESSAGE_KINDS = ['text', 'system', 'contact_request', 'contact_share'] as const;

export const chatStartDirectSchema = z.object({
  peerUserId: z.string().uuid('Destinatário inválido.'),
  contextType: z.enum(CHAT_CONTEXT_TYPES).default('general'),
  contextId: z.string().uuid('Contexto inválido.').optional().nullable(),
  propertyId: z.string().uuid('Património inválido.').optional().nullable(),
  contractId: z.string().uuid('Contrato inválido.').optional().nullable(),
  title: z.string().trim().max(140, 'O título é demasiado longo.').optional().nullable(),
});

export const chatSendMessageSchema = z.object({
  conversationId: z.string().uuid('Conversa inválida.'),
  body: z
    .string()
    .trim()
    .min(1, 'Escreva uma mensagem.')
    .max(4000, 'Mensagem demasiado longa (máx. 4000 caracteres).'),
  kind: z.enum(CHAT_MESSAGE_KINDS).default('text'),
});

export const chatConversationIdSchema = z.object({
  conversationId: z.string().uuid('Conversa inválida.'),
});

export const chatSetStatusSchema = z.object({
  conversationId: z.string().uuid('Conversa inválida.'),
  status: z.enum(CHAT_CONVERSATION_STATUSES),
});

export type ChatStartDirectInput = z.infer<typeof chatStartDirectSchema>;
export type ChatSendMessageInput = z.infer<typeof chatSendMessageSchema>;
export type ChatConversationIdInput = z.infer<typeof chatConversationIdSchema>;
export type ChatSetStatusInput = z.infer<typeof chatSetStatusSchema>;
