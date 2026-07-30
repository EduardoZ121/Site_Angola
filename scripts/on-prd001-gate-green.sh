#!/usr/bin/env bash
# Run AFTER P1+P2 evidence exists. Verifies P1 via GitHub API; reminds P2 is human-attested.
# Prints the activation sequence for PRD-001 implementation (conditional auth already issued).
# Does NOT invent Gate green — operator must have filled Gate §8.1–§8.2 (or be about to).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== PRD-001 Gate-green activation checklist =="
echo "Gate: docs/backlog/PRD_001_ENGINEERING_GATE.md"
echo "Readiness: docs/backlog/PRD_001_IMPLEMENTATION_READINESS.md"
echo ""

P1_OK=0
if bash "$ROOT/scripts/check-gate-p1.sh"; then
  P1_OK=1
else
  echo ""
  echo "P1 not objectively green yet. Stop — do not start auth implementation."
  exit 1
fi

echo ""
echo "== P2 (migration 0002 remoto) =="
echo "This script cannot verify Supabase without credentials."
echo "Confirm Gate §8.2 has: project ref, date, who applied, checklist OK."
echo -n "Type YES if Gate §8.2 is filled with real evidence: "
read -r P2_CONFIRM
if [[ "${P2_CONFIRM}" != "YES" ]]; then
  echo "Aborted — P2 not confirmed."
  exit 1
fi

echo ""
echo "== Activation sequence (autorização condicional já emitida) =="
cat <<'STEPS'
1. Update docs/backlog/PRD_001_ENGINEERING_GATE.md:
   - Mark P1 ✅ and P2 ✅ with evidence tables §8.1–§8.2
   - Set Gate state to verde / Fase 2 activa
2. Mark docs/backlog/PRD_001_IMPLEMENTATION_READINESS.md as Activo
3. git fetch origin && git checkout main && git pull
4. git checkout -b cursor/prd-001-authentication-f96b
5. Implement PRD-001 v1.0 to module completion (N5)
6. Follow R1–R12, §16.5 RPC, content inventory, ADR-004
7. Interrupt only for business/strategic/critical-risk issues
STEPS

echo ""
echo "P1 check: OK (exit ${P1_OK})"
echo "P2: operator-confirmed YES"
echo "Ready to implement — no further PO confirmation required."
