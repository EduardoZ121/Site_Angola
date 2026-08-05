# Documentos institucionais Kuteka (v1.0 Beta)

Fontes Markdown oficiais + exportações PDF/Word para publicação e download.

| Documento               | Markdown                                                           | PDF / Word                                                   |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Termos de Utilização    | [TERMOS_UTILIZACAO_v1.md](./TERMOS_UTILIZACAO_v1.md)               | [`exports/`](./exports/) · também em `apps/web/public/docs/` |
| Política de Privacidade | [POLITICA_PRIVACIDADE_v1.md](./POLITICA_PRIVACIDADE_v1.md)         | idem                                                         |
| Manual do Utilizador    | [../help/MANUAL_UTILIZADOR_v1.md](../help/MANUAL_UTILIZADOR_v1.md) | `docs/help/exports/` · `public/docs/`                        |

## Regenerar PDF e Word

```bash
python3 scripts/generate-legal-docs.py
```

Requisitos: `python-docx`, `reportlab`.

## Páginas da plataforma

- `/termos`
- `/privacidade`
- `/app/ajuda` (manual completo + downloads)

**Nota:** estes textos são a base oficial da Beta. Qualquer alteração material deve incrementar a versão e a data de vigência.
