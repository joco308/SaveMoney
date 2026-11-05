import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Valida body/query/params con Zod y guarda el resultado tipado en
 * `req.validated`. No reasigna `req.query` porque Express 5 lo expone como getter.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      req.validated = {
        body: schemas.body ? schemas.body.parse(req.body) : req.body,
        query: schemas.query ? schemas.query.parse(req.query) : req.query,
        params: schemas.params ? schemas.params.parse(req.params) : req.params,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
