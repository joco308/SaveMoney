export interface AuthContext {
  /** `sub` del access token local: string del `id_usuario` (BigInt). */
  sub: string;
  email?: string;
  role?: string;
}
