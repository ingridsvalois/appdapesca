/**
 * Blacklist de refresh tokens invalidados no logout (em memória).
 * Em produção com múltiplas instâncias, usar Redis ou tabela no banco.
 */
const blacklist = new Set<string>();

export function revokeRefreshToken(token: string): void {
  blacklist.add(token);
}

export function isRevoked(token: string): boolean {
  return blacklist.has(token);
}
