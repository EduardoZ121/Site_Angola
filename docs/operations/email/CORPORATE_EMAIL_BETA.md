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

### Auth / transactional

```
Kuteka App (signUp / reset / resend)
        ↓
Supabase Auth
        ↓
Custom SMTP (smtp.resend.com:465, user resend)
        ↓
Resend
        ↓
From: Kuteka <no-reply@kutekalink.com>
```

**Oficial:** remetente no **apex** `kutekalink.com` (`no-reply@kutekalink.com`).  
**Obsoleto (não usar):** `mail.kutekalink.com` / `noreply@mail.kutekalink.com` — proposta antiga do kit bridge; DNS live e SMTP Dashboard usam o apex.

O frontend **não** envia confirmação via API Resend. O pacote estático de produção não inclui mailer server-side.

## Estado produção (2026-09-17)

| Item                 | Estado                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| `mailer_autoconfirm` | **`false`** (corrigido no Dashboard)                                   |
| Confirm email        | **ON**                                                                 |
| Custom SMTP          | **ON** · sender `no-reply@kutekalink.com`                              |
| Entrega Resend       | **Ainda a falhar** — signup devolve `Error sending confirmation email` |

### Próximo passo ops (único bloqueio de envio)

Revalidar no Dashboard a **password SMTP** (= Resend API key válida) e o domínio `kutekalink.com` em Resend → Domains. Sem alterar DNS nem arquitectura.

Redirects mínimos:

- Site URL: `https://kutekalink.com`
- `https://kutekalink.com/auth/verificar` e `…/auth/verificar/`
- `https://kutekalink.com/auth/recuperar/confirmar` e `…/confirmar/`

## Futuro Google Workspace

Trocar apenas MX/Routing humano no apex; manter SMTP Auth → Resend no apex (ou subdomínio dedicado se no futuro se isolar reputação).
