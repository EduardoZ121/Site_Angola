/** Map Supabase / RPC identity gate errors to PT copy. */

const KYC_HINT =
  'Complete a verificação de identidade (KIS · KYC nível 2+) em Perfil antes de continuar.';

export function mapIdentityGateMessage(raw: string | null | undefined, fallback: string): string {
  const msg = (raw ?? '').toLowerCase();
  if (
    msg.includes('identity verification') ||
    msg.includes('kyc level') ||
    msg.includes('assert_actor_meets_kyc') ||
    (msg.includes('kyc') && msg.includes('required'))
  ) {
    return KYC_HINT;
  }
  return raw?.trim() || fallback;
}
