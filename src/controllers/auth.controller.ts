import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../schemas/auth.schema";
import * as authService from "../services/auth.service";
import { toPublicUsuario } from "../services/usuario.service";
import { ApiError } from "../types/api-error";

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);
    const result = await authService.registerUser(data);

    res.status(201).json({
      success: true,
      data: result,
    });
  },
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginUser(data.email, data.password);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const refreshController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = refreshSchema.parse(req.body);
    const result = await authService.refreshUserSession(data.refreshToken);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = logoutSchema.parse(req.body);
    const result = await authService.logoutUser(data.refreshToken);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const authMeController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.usuario) {
      throw ApiError.unauthorized();
    }

    res.status(200).json({
      success: true,
      data: toPublicUsuario(req.usuario),
    });
  },
);