# Module: contratos

PRD-008 — primeiro módulo de expansão após Platform Core v1.0.

## Fluxo

Confiança → Administração → **Contrato** → Pagamento → Conclusão.

## Implementação

- `content/pt.ts` — copy pt-AO.
- `services/contracts-client.ts` — cliente Supabase browser e RPCs.
- `components/ContractsHubClient.tsx` — hub, lista e demos.
- `components/CreateContractForm.tsx` — criação MVP.
- `components/ContractDetailClient.tsx` — detalhe estático via `?id=` e transições.

Pagamentos permanece em expansão; os CTAs seguem para `/app` com copy explícita.
