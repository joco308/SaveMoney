import type { usuario } from "../generated/prisma/client";
import type { AuthContext } from "./auth";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      usuario?: usuario;
      validated?: {
        body: unknown;
        query: unknown;
        params: unknown;
      };
    }
  }
}

export {};
