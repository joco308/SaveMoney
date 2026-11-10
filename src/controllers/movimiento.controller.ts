import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import {
  movimientoIdSchema,
  listarMovimientosSchema,
  crearMovimientoSchema,
  actualizarMovimientoSchema,
} from "../schemas/movimiento.schema";
import * as movimientoService from "../services/movimiento.service";

export const listarMovimientosController = asyncHandler(
  async (req: Request, res: Response) => {
    const filtros = listarMovimientosSchema.parse(req.validated?.query);

    const resultado = await movimientoService.listarMovimientos(
      req.usuario!.id_usuario,
      filtros,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);

export const obtenerMovimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = movimientoIdSchema.parse(req.validated?.params);

    const movimiento = await movimientoService.obtenerMovimiento(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({
      success: true,
      data: movimiento,
    });
  },
);

export const crearMovimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = crearMovimientoSchema.parse(req.validated?.body);

    const movimiento = await movimientoService.crearMovimiento(
      req.usuario!.id_usuario,
      data,
    );

    res.status(201).json({
      success: true,
      data: movimiento,
    });
  },
);

export const actualizarMovimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = movimientoIdSchema.parse(req.validated?.params);
    const data = actualizarMovimientoSchema.parse(req.validated?.body);

    const movimiento = await movimientoService.actualizarMovimiento(
      params.id,
      req.usuario!.id_usuario,
      data,
    );

    res.status(200).json({
      success: true,
      data: movimiento,
    });
  },
);

export const eliminarMovimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = movimientoIdSchema.parse(req.validated?.params);

    const resultado = await movimientoService.eliminarMovimiento(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);
