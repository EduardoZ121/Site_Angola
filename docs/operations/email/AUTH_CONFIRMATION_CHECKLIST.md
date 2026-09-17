# Checklist — ativar confirmação de e-mail (produção)

**Problema:** cadastro sem logs no Resend.  
**Causa raiz comprovada:** `mailer_autoconfirm=true` no Auth Settings públicos do projecto.

| #   | Onde                         | Acção                                        | Estado       |
| --- | ---------------------------- | -------------------------------------------- | ------------ |
| 1   | Supabase → Auth → Email      | Confirmations ON, autoconfirm OFF            | ⬜ manual    |
| 2   | Supabase → URL Configuration | Site URL + redirects `/auth/verificar/`      | ⬜ manual    |
| 3   | Supabase → SMTP              | Resend + `no-reply@kutekalink.com`           | ⬜ verificar |
| 4   | Resend Domains               | `kutekalink.com` verified                    | ⬜ verificar |
| 5   | App                          | `/auth/registar` → email fresco → Resend log | ⬜ após 1–4  |

Código (este PR): redirects com trailing slash, `resend` com `emailRedirectTo`, erros 422 não mapeados todos para duplicate, F2 sem sandbox em produção.
