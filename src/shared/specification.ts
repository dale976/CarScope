export interface SpecEvidence {
  source: 'Features list' | 'Seller description' | 'Options list';
  claim: 'present' | 'absent' | 'unconfirmed';
  text: string;
}
export function assessEvidence(evidence: SpecEvidence[]) {
  if (!evidence.length) return 'Unknown';
  const claims = new Set(evidence.map(e => e.claim));
  if (claims.has('unconfirmed') || (claims.has('present') && claims.has('absent'))) return 'Needs confirmation';
  return claims.has('present') ? 'Advertised' : 'Advertised absent';
}
