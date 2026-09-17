# Checklist — ativar confirmação de e-mail (produção)

**Problema:** cadastro sem logs no Resend.  
**Causa raiz comprovada:** `mailer_autoconfirm=true` no Auth Settings públicos do projecto.

## Prova live (revalidada 2026-09-17)

| Check                                 | Resultado                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `GET /auth/v1/settings`               | `mailer_autoconfirm: true`                                                         |
| `POST /auth/v1/signup` (email fresco) | `has_session: true`, `email_confirmed_at` preenchido, `confirmation_sent_at: null` |
| Conclusão                             | Supabase **não chama SMTP** → Resend sem logs. Não é bug do frontend `signUp()`.   |

Projecto: `vhqwitbrpqaiutjbundo` → https://kutekalink.com

| #   | Onde                                                                                                    | Acção                                                                                                                       | Estado       |
| --- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | [Auth → Providers → Email](https://supabase.com/dashboard/project/vhqwitbrpqaiutjbundo/auth/providers)  | Confirm email **ON**; Automatic confirmation / autoconfirm **OFF**                                                          | ⬜ manual    |
| 2   | [URL Configuration](https://supabase.com/dashboard/project/vhqwitbrpqaiutjbundo/auth/url-configuration) | Site URL `https://kutekalink.com`; redirects `/auth/verificar/` + `/auth/recuperar/confirmar/` (com e sem trailing slash)   | ⬜ manual    |
| 3   | [SMTP Settings](https://supabase.com/dashboard/project/vhqwitbrpqaiutjbundo/settings/auth)              | Host `smtp.resend.com` · Port `465` · User `resend` · Sender `no-reply@kutekalink.com` · Password = Resend API key (secret) | ⬜ verificar |
| 4   | Resend → Domains                                                                                        | `kutekalink.com` verified (DKIM apex + `send.` já públicos)                                                                 | ⬜ verificar |
| 5   | App                                                                                                     | `/auth/registar/` → email fresco → Resend Logs + inbox                                                                      | ⬜ após 1–4  |

### Verificação pós-toggle (sem secrets)

```bash
# Deve passar a false:
curl -sS "$SUPABASE_URL/auth/v1/settings" -H "apikey: $ANON" | jq .mailer_autoconfirm
# Novo signup: confirmation_sent_at preenchido, access_token ausente até confirmar
```

## Código (branch local `cursor/auth-email-confirm-fix-f96b`, commit `c5170f5`)

- `emailRedirectTo` com trailing slash em signup / resend / recover
- mapping de erro 422 mais estreito (não tratar tudo como duplicate)
- F2 / sandbox OTP oculto em produção
- `VerifyPanel` deixa de fingir destino verificado sem sessão
- Docs oficiais: apex `no-reply@kutekalink.com`; obsoleto `mail.kutekalink.com`

**Push bloqueado:** `cursor[bot]` sem write em `EduardoZ121/Site_Angola` (ambiente Cloud ligado a `meu-site-222`). Ver artifact `site-angola-auth-email/APPLY.md`.
