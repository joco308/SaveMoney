export interface AuthContext {
  /** `sub` del JWT de Supabase (UUID de auth.users). */
  sub: string;
  email?: string;
  role?: string;
}
