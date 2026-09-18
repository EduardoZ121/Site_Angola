# Arquitectura de e-mail Kuteka (oficial)

## Decisão vigente (produção)

### Human / operational

```
info@ | support@ | partnerships@ | contacto@ | privacidade@ | juridico@
        ↓
Cloudflare Email Routing
        ↓
kutekalink@gmail.com
```

### Auth / transactional — VALIDADO 2026-09-17

```
Kuteka App (signUp / reset / resend)
        ↓
Supabase Auth (Confirm email ON, autoconfirm OFF)
        ↓
Custom SMTP (smtp.resend.com:465, user resend)
        ↓
Resend
        ↓
From: Kuteka <no-reply@kutekalink.com>
        ↓
Inbox (Gmail verificado em teste real)
```

**Oficial:** remetente no **apex** `kutekalink.com` (`no-reply@kutekalink.com`).  
**Obsoleto:** `mail.kutekalink.com` / `noreply@mail.kutekalink.com`.

O frontend **não** envia confirmação via API Resend directa. Produção estática usa Supabase Auth + SMTP.

## Estado produção

| Item                 | Estado                                    |
| -------------------- | ----------------------------------------- |
| `mailer_autoconfirm` | `false`                                   |
| Confirm email        | ON                                        |
| Custom SMTP + Resend | ON · entrega Gmail **validada**           |
| Assunto típico       | _Confirm your email address_              |
| UI F2                | `/auth/verificar/` — link + OTP 6 dígitos |

### Notas ops

- Resend pode rejeitar destinos como `@example.com`; usar emails reais nos smokes.
- Confirmar Logs no [Resend Dashboard](https://resend.com/emails) após cada smoke (agente sem `RESEND_API_KEY`).
- Redirects mínimos: Site URL `https://kutekalink.com`; `/auth/verificar/` e `/auth/recuperar/confirmar/` (com/sem trailing slash).

## Futuro Google Workspace

Trocar apenas MX/Routing humano no apex; manter SMTP Auth → Resend no apex.
