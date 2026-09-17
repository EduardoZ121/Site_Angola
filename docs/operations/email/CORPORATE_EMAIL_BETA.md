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
**Obsoleto (não usar):** `mail.kutekalink.com` / `noreply@mail.kutekalink.com` — eram proposta do kit bridge; DNS live e SMTP Dashboard usam o apex.

O frontend **não** envia confirmação via API Resend. O pacote estático de produção não inclui mailer server-side.

## Bloqueio conhecido (2026-09-17)

API pública `/auth/v1/settings` reporta:

`mailer_autoconfirm: true`

Com isto, `signUp` devolve sessão + `email_confirmed_at` imediatamente e **`confirmation_sent_at` fica null** — nenhum e-mail chega ao Resend.

### Acção Dashboard (obrigatória)

Projecto: `vhqwitbrpqaiutjbundo` (ligado a kutekalink.com)

1. **Authentication → Providers → Email**
   - Enable email confirmations: **ON**
   - Automatic / autoconfirm: **OFF**
2. **Authentication → URL Configuration**
   - Site URL: `https://kutekalink.com`
   - Redirect URLs (mínimo):
     - `https://kutekalink.com/auth/verificar`
     - `https://kutekalink.com/auth/verificar/`
     - `https://kutekalink.com/auth/recuperar/confirmar`
     - `https://kutekalink.com/auth/recuperar/confirmar/`
     - `https://www.kutekalink.com/**` (se www for usado)
3. **Authentication → SMTP**
   - Host `smtp.resend.com`, port `465`, user `resend`
   - Password = Resend API key (secret)
   - Sender email `no-reply@kutekalink.com`, name `Kuteka`
4. Resend: domínio `kutekalink.com` verificado (DKIM apex / `send.` já observados publicamente)
5. Teste: novo email em `/auth/registar` → log no Resend + inbox

## Futuro Google Workspace

Trocar apenas MX/Routing humano no apex; manter SMTP Auth → Resend no apex (ou subdomínio dedicado se no futuro se isolar reputação).
