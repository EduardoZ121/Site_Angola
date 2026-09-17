# Checklist — confirmação de e-mail (produção)

Projecto: `vhqwitbrpqaiutjbundo` → https://kutekalink.com  
Remetente oficial: `Kuteka <no-reply@kutekalink.com>` (apex).  
**Obsoleto:** `mail.kutekalink.com` / `noreply@mail.*`.

## Estado — VALIDADO em produção (2026-09-17)

Teste real por utilizador externo:

| Passo                         | Resultado                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `/auth/registar/`             | Conta criada                                                                        |
| Supabase Auth → SMTP → Resend | E-mail enviado                                                                      |
| Inbox Gmail                   | Recebido; remetente **Kuteka**; assunto _Confirm your email address_; link presente |
| `/auth/verificar/`            | Abre; UI com link + código 6 dígitos                                                |

| Check técnico                         | Resultado                                                           |
| ------------------------------------- | ------------------------------------------------------------------- |
| `mailer_autoconfirm`                  | **`false`**                                                         |
| Confirm email / Email provider        | ON                                                                  |
| Custom SMTP                           | ON · `smtp.resend.com:465` · `resend` · `no-reply@kutekalink.com`   |
| Probe API (domínio não-`example.com`) | `confirmation_sent_at` preenchido; sem `access_token`               |
| Probe `*@example.com`                 | Pode falhar no Resend (domínio reservado) — **não** usar como prova |

| #   | Item                                                | Estado                                                              |
| --- | --------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Confirm ON · autoconfirm OFF                        | ✅                                                                  |
| 2   | SMTP Resend + sender apex                           | ✅                                                                  |
| 3   | Entrega Gmail (teste humano)                        | ✅                                                                  |
| 4   | Redirects `/auth/verificar/` (trailing slash)       | ✅ no código SoT; live ainda em build anterior até deploy do branch |
| 5   | Resend Logs (UI Dashboard)                          | ⬜ confirmar visualmente no Resend (sem API key no agente)          |
| 6   | Password recovery smoke                             | ⬜ teste humano residual                                            |
| 7   | Push/PR branch `cursor/auth-email-confirm-fix-f96b` | ⬜ bloqueado 403 `cursor[bot]`                                      |

## Fluxo canónico (código)

```
/auth/registar/ → signUp({ emailRedirectTo: …/auth/verificar/ })
  → (sem sessão) /auth/verificar/?email=
  → link email OU OTP 6 dígitos → sessão confirmada
/auth/recuperar/ → resetPasswordForEmail(…/auth/recuperar/confirmar/)
```

## Código na branch (ainda por push)

- trailing slash em `emailRedirectTo`
- `needsEmailVerification` = não confirmado
- erro SMTP mapeado; resend sem falso sucesso
- `VerifyPanel` com `onAuthStateChange` após link
- prebuilt estático actualizado
