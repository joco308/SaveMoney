export interface AuthContext {
  sub: string;
  email?: string;
  token_use: "access";
}