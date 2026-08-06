'use client';

import {
  chatConversationIdSchema,
  chatSendMessageSchema,
  chatSetStatusSchema,
  chatStartDirectSchema,
  type ChatSendMessageInput,
  type ChatSetStatusInput,
  type ChatStartDirectInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getMensagensCopy } from '../content';

export type ChatConversationStatus = 'active' | 'archived' | 'completed';
export type ChatContextType =
  'property' | 'contract' | 'service' | 'general' | 'admin' | 'interest';
export type ChatMessageKind = 'text' | 'system' | 'contact_request' | 'contact_share';

export type ChatConversationSummary = {
  id: string;
  status: ChatConversationStatus;
  context_type: ChatContextType;
  context_id: string | null;
  property_id: string | null;
  contract_id: string | null;
  title: string | null;
  peer_user_id: string | null;
  peer_name: string;
  peer_role: string | null;
  last_preview: string;
  last_preview_kind: ChatMessageKind | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  kind: ChatMessageKind;
  metadata: Record<string, unknown>;
  created_at: string;
  is_self: boolean;
};

export type ChatParticipant = {
  user_id: string;
  role: string;
  display_name: string;
  is_self: boolean;
  last_read_at: string | null;
};

export type ChatThread = {
  conversation: {
    id: string;
    status: ChatConversationStatus;
    context_type: ChatContextType;
    context_id: string | null;
    property_id: string | null;
    contract_id: string | null;
    title: string | null;
    created_at: string;
    last_message_at: string;
    contacts_released: boolean;
  };
  participants: ChatParticipant[];
  messages: ChatMessage[];
};

type ChatResult<T> = { ok: true; data: T } | { ok: false; message: string };

function mapChatError(errorMessage: string | undefined, fallback: string): string {
  const copy = getMensagensCopy(resolveUiLocale());
  const msg = errorMessage?.toLowerCase() ?? '';
  if (msg.includes('cannot start a conversation with yourself')) return copy.cta.messageSelf;
  if (msg.includes('messaging is not allowed') || msg.includes('pairing'))
    return copy.cta.notAllowed;
  if (msg.includes('contacts are only released')) return copy.contactPolicy.shareLocked;
  if (msg.includes('not a participant')) return copy.forbidden;
  if (msg.includes('authentication required')) return copy.forbidden;
  return fallback;
}

export async function listConversations(
  query?: string | null,
): Promise<ChatResult<ChatConversationSummary[]>> {
  const copy = getMensagensCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_chat_list_conversations', {
      p_query: query?.trim() || null,
    });
    if (error) return { ok: false, message: mapChatError(error.message, copy.loadError) };
    return { ok: true, data: (data as ChatConversationSummary[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function getThread(conversationId: string): Promise<ChatResult<ChatThread>> {
  const copy = getMensagensCopy(resolveUiLocale());
  const parsed = chatConversationIdSchema.safeParse({ conversationId });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.threadLoadError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_chat_get_thread', {
      p_conversation_id: parsed.data.conversationId,
    });
    if (error || !data)
      return { ok: false, message: mapChatError(error?.message, copy.threadLoadError) };
    return { ok: true, data: data as ChatThread };
  } catch {
    return { ok: false, message: copy.threadLoadError };
  }
}

export async function sendMessage(input: ChatSendMessageInput): Promise<ChatResult<ChatMessage>> {
  const copy = getMensagensCopy(resolveUiLocale());
  const parsed = chatSendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.sendError };
  }
  try {
    const client = createBrowserClient();
    const v = parsed.data;
    const { data, error } = await client.rpc('kuteka_chat_send_message', {
      p_conversation_id: v.conversationId,
      p_body: v.body,
      p_kind: v.kind,
    });
    if (error || !data) return { ok: false, message: mapChatError(error?.message, copy.sendError) };
    return { ok: true, data: data as ChatMessage };
  } catch {
    return { ok: false, message: copy.sendError };
  }
}

export async function markRead(conversationId: string): Promise<ChatResult<true>> {
  const copy = getMensagensCopy(resolveUiLocale());
  const parsed = chatConversationIdSchema.safeParse({ conversationId });
  if (!parsed.success) return { ok: false, message: copy.loadError };
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('kuteka_chat_mark_read', {
      p_conversation_id: parsed.data.conversationId,
    });
    if (error) return { ok: false, message: mapChatError(error.message, copy.loadError) };
    return { ok: true, data: true };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function setStatus(input: ChatSetStatusInput): Promise<ChatResult<true>> {
  const copy = getMensagensCopy(resolveUiLocale());
  const parsed = chatSetStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.statusChangeError };
  }
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('kuteka_chat_set_status', {
      p_conversation_id: parsed.data.conversationId,
      p_status: parsed.data.status,
    });
    if (error) return { ok: false, message: mapChatError(error.message, copy.statusChangeError) };
    return { ok: true, data: true };
  } catch {
    return { ok: false, message: copy.statusChangeError };
  }
}

export async function unreadTotal(): Promise<ChatResult<number>> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_chat_unread_total');
    if (error) return { ok: false, message: getMensagensCopy(resolveUiLocale()).topbar.loadError };
    return { ok: true, data: typeof data === 'number' ? data : 0 };
  } catch {
    return { ok: false, message: getMensagensCopy(resolveUiLocale()).topbar.loadError };
  }
}

export async function startDirect(input: ChatStartDirectInput): Promise<ChatResult<string>> {
  const copy = getMensagensCopy(resolveUiLocale());
  const parsed = chatStartDirectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.startError };
  }
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user?.id && user.id === parsed.data.peerUserId) {
      return { ok: false, message: copy.cta.messageSelf };
    }

    const v = parsed.data;
    const { data, error } = await client.rpc('kuteka_chat_start_direct', {
      p_peer_user_id: v.peerUserId,
      p_context_type: v.contextType,
      p_context_id: v.contextId ?? null,
      p_property_id: v.propertyId ?? null,
      p_contract_id: v.contractId ?? null,
      p_title: v.title ?? null,
    });
    if (error || typeof data !== 'string') {
      return { ok: false, message: mapChatError(error?.message, copy.startError) };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, message: copy.startError };
  }
}
