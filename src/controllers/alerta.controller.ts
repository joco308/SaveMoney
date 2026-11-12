import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import {
  alertaIdSchema,
  listarAlertasSchema,
} from "../schemas/alerta.schema";
import * as alertaService from "../services/alerta.service";

export const listarAlertasController = asyncHandler(
  async (req: Request, res: Response) => {
    const filtros = listarAlertasSchema.parse(req.validated?.query);

    const resultado = await alertaService.listarAlertas(
      req.usuario!.id_usuario,
      filtros,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);

export const obtenerAlertaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = alertaIdSchema.parse(req.validated?.params);

    const resultado = await alertaService.obtenerAlerta(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);

export const marcarAlertaLeidaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = alertaIdSchema.parse(req.validated?.params);

    const resultado = await alertaService.marcarAlertaLeida(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);

export const marcarTodasLeidasController = asyncHandler(
  async (req: Request, res: Response) => {
    const resultado = await alertaService.marcarTodasLeidas(
      req.usuario!.id_usuario,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);

export const eliminarAlertaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = alertaIdSchema.parse(req.validated?.params);

    const resultado = await alertaService.eliminarAlerta(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);
