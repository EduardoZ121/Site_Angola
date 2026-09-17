# Checklist — confirmação de e-mail (produção)

Projecto: `vhqwitbrpqaiutjbundo` → https://kutekalink.com  
Remetente oficial: `no-reply@kutekalink.com` (apex). **Obsoleto:** `mail.kutekalink.com` / `noreply@mail.*`.

## Estado revalidado 2026-09-17 (após toggle Dashboard)

| Check                                          | Resultado                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `GET /auth/v1/settings` → `mailer_autoconfirm` | **`false`** ✅                                                                |
| Confirm email / Email provider                 | ON (confirmado pelo fundador)                                                 |
| Custom SMTP                                    | ON · `smtp.resend.com:465` · user `resend` · sender `no-reply@kutekalink.com` |
| `POST /auth/v1/signup` (email fresco)          | **HTTP 500** `Error sending confirmation email` (`unexpected_failure`)        |

**Leitura:** Auth já exige confirmação (não auto-confirma). A cadeia parte no **envio SMTP → Resend**. O frontend `signUp()` + `emailRedirectTo` estão correctos; o bloqueio actual é a entrega no Dashboard/Resend (password SMTP / domínio / template).

| #   | Onde                     | Acção                                                                         | Estado                 |
| --- | ------------------------ | ----------------------------------------------------------------------------- | ---------------------- |
| 1   | Auth → Providers → Email | Confirm ON · autoconfirm OFF                                                  | ✅ feito               |
| 2   | Auth → URL Configuration | Site URL + redirects `/auth/verificar/` + `/auth/recuperar/confirmar/`        | ⬜ verificar           |
| 3   | Auth → SMTP              | Re-guardar password = Resend API key actual; sender `no-reply@kutekalink.com` | ⬜ **bloqueio actual** |
| 4   | Resend → Domains         | `kutekalink.com` Verified; API key com permissão de envio                     | ⬜ verificar           |
| 5   | Resend → Logs            | Após signup bem-sucedido deve aparecer evento                                 | ⬜ após 3–4            |
| 6   | App                      | `/auth/registar/` → email fresco → inbox + link → `/auth/verificar/`          | ⬜ após 3–5            |

### Verificação pós-SMTP (sem secrets)

```bash
# Deve continuar false:
curl -sS "$URL/auth/v1/settings" -H "apikey: $ANON" | jq .mailer_autoconfirm

# Signup fresco: HTTP 200, confirmation_sent_at preenchido, sem access_token
curl -sS -X POST "$URL/auth/v1/signup" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste-novo@example.com","password":"ProbeTest123!aa"}'
```

### Acção Dashboard exacta (SMTP)

1. Abrir https://supabase.com/dashboard/project/vhqwitbrpqaiutjbundo/settings/auth
2. Secção **SMTP Settings** → confirmar Host/Port/User/Sender
3. Colar de novo a **Resend API key** no campo password (não partilhar no chat)
4. Guardar → repetir signup de teste → abrir Resend Logs

## Código (branch `cursor/auth-email-confirm-fix-f96b`)

- `emailRedirectTo` com trailing slash (static export)
- `needsEmailVerification` = email não confirmado (inclui sessão sem confirm)
- Erro GoTrue “Error sending confirmation email” → mensagem clara ao utilizador
- Resend F2: não fingir sucesso se Supabase `resend` falhou
- `VerifyPanel`: `onAuthStateChange` após link de confirmação
- Docs alinhadas a `no-reply@kutekalink.com`
