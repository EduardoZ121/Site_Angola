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

## Autenticado (credencial de teste necessária — bloqueio C se ausente)

1. Login conta com papel cliente → `/app/ajuda` → submeter sugestão e bug → sucesso.
2. Login conta `finance.manage` → `/app/super` KOCC → métricas + inbox com linhas.
3. Login conta só `admin.panel` → `/app/admin` → secção Inbox Beta com linhas; métricas podem falhar sem mascarar inbox.
4. Confirmar empty ≠ error (falha de SELECT não mostra «Ainda sem relatos»).

## Não testar nesta Beta

- Workflow GOV-BF / tickets / 0043–45
- Pagamentos reais / Kuteka Pay live
- Fork Vicente
