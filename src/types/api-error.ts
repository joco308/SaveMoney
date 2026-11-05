export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details: unknown[];

  constructor(statusCode: number, code: ErrorCode, message: string, details: unknown[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details: unknown[] = []): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "No autenticado"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Acceso denegado"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Recurso no encontrado"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }
}
