# Auditoria local — fluxo Beta Feedback → Inbox → KOCC (write bloqueado)

**Tip:** `37c8bf91`+ (este ciclo). SoT: `EduardoZ121/Site_Angola`.  
**Não aplicado:** GOV-BF-01…05, propostas `0043`/`0044`, workflow de tickets.

## Fluxo actual (reutilizado)

1. Utilizador autenticado → `/app/ajuda` → `BetaFeedbackForm`
2. Cliente: sanitize `page_path` / body / kind → RPC `kocc_submit_beta_feedback`
3. INSERT `public.beta_feedback` (`feedback`|`bug`) + track servidor `beta.feedback`
4. Cliente track diferenciado `beta.feedback.bug` | `beta.feedback.suggestion`
5. KOCC: `kocc_beta_metrics` (exige `finance.manage`) + SELECT inbox (`finance.manage` **ou** `admin.panel`)
6. UI: métricas e inbox **independentes**; empty ≠ error (`shouldShowSoftEmpty`)

## RLS / permissões (só leitura)

| Superfície          | Regra                            |
| ------------------- | -------------------------------- |
| INSERT own / RPC    | `actor_id = auth.uid()`          |
| SELECT inbox        | `finance.manage` ∨ `admin.panel` |
| UPDATE/DELETE       | revogados a `authenticated`      |
| `kocc_beta_metrics` | só `finance.manage`              |

### Notas técnicas (não são decisões GOV a executar aqui)

- **Telemetria RPC:** `0035` conta sempre `beta.feedback` independentemente de `p_kind`; o cliente acrescenta códigos por kind. Contadores de tabela (feedback/bugs) vêm de `beta_feedback.kind`, não do label genérico do track.
- **GRANT INSERT directo** em `beta_feedback` existe além do RPC — UI oficial usa RPC; um insert directo ignora sanitize cliente. Mitigação futura = migration dedicada (não `0043`/`0044`) — **proposta apenas**, não aplicada.
- **Founder read:** gap isolado em `0043` — sem alteração.

## Correcções deste bloco (seguro)

- Bridge reclamação: CTA principal `/contacto`; ops → `/app/admin#escalacoes` (evita dead-end Forbidden para utilizadores comuns)
- Copy i18n alinhada (pt/en/es/fr)
- Inbox KOCC mostra `actor:` + 8 chars do `actor_id` (já seleccionado; antes não renderizado no painel Beta)

## Resolução / feedback ao autor

BETA-22/23 e estados permanecem **GOV-BF** — sem schema novo neste período.
