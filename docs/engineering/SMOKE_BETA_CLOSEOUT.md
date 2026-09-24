# Smoke — Kuteka Beta closeout

## Público (sem sessão)

```bash
curl -sI https://kutekalink.com/ | head -20
curl -s https://kutekalink.com/health.json
curl -s https://kutekalink.com/ | grep -o 'Kuteka · Beta pública · Angola' | head -1
curl -sI https://kutekalink.com/auth/registar/ | head -5
curl -sI https://kutekalink.com/documentacao/ | head -5
curl -sI https://kutekalink.com/app/ajuda/ | head -5
```

Esperado: HTTP 200; hero Beta; health.json `status=ok`.

## Segurança edge

```bash
curl -sI https://kutekalink.com/ | grep -iE 'content-security|strict-transport|x-frame|referrer-policy|permissions-policy|x-content-type'
```

Esperado (após CF rules): 6 headers. Hoje pode falhar parcialmente → ver `docs/security/PRODUCTION_EDGE_HEADERS.md`.

## Autenticado (credencial de teste necessária)

1. Login conta com papel cliente → `/app/ajuda` → submeter sugestão e bug → sucesso.
2. Login conta `finance.manage` → `/app/super` KOCC → métricas + inbox com linhas.
3. No cartão do relato: idioma, ecrã e caminho (`page_context`). Mudar estado (ex. `em_analise`) e gravar uma nota interna. A nota não gera aviso ao autor.
4. Estado terminal (`resolvido`) não oferece saltos para `em_desenvolvimento`; reabrir só `em_analise` ou `received`.
5. Login conta só `admin.panel` → `/app/admin` → secção Inbox Beta com o mesmo cartão; métricas podem falhar sem mascarar inbox.
6. Confirmar empty ≠ error (falha de SELECT não mostra «Ainda sem relatos»).
7. Agente: hub → lead aberto → «Assumir lead» (RPC `assign_property_interest`).
8. Parceiro: checklist de completude na ficha do património.

## Não testar nesta Beta

- Aviso ao autor quando o relato fica resolvido (BETA-23, Founder off)
- Screenshots no feedback
- Pagamentos reais / Kuteka Pay live / custódia
- Growth Engine, Delegation Engine, Board, scraping AGT
