import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import {
  emprendimientoIdSchema,
  listarEmprendimientosSchema,
  crearEmprendimientoSchema,
  actualizarEmprendimientoSchema,
  cambiarEstadoEmprendimientoSchema,
} from "../schemas/emprendimiento.schema";
import * as emprendimientoService from "../services/emprendimiento.service";

export const listarEmprendimientosController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listarEmprendimientosSchema.parse(
      req.validated?.query,
    );
    const usuarioId = req.usuario!.id_usuario;

    const resultado =
      await emprendimientoService.listarEmprendimientos(
        usuarioId,
        query.page,
        query.limit,
        query.activo !== undefined
          ? query.activo === "true"
          : undefined,
      );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);

export const obtenerEmprendimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = emprendimientoIdSchema.parse(
      req.validated?.params,
    );
    const usuarioId = req.usuario!.id_usuario;

    const emprendimiento =
      await emprendimientoService.obtenerEmprendimiento(
        params.id,
        usuarioId,
      );

    res.status(200).json({
      success: true,
      data: emprendimiento,
    });
  },
);

export const crearEmprendimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = crearEmprendimientoSchema.parse(
      req.validated?.body,
    );
    const usuarioId = req.usuario!.id_usuario;

    const emprendimiento =
      await emprendimientoService.crearEmprendimiento(
        usuarioId,
        data,
      );

    res.status(201).json({
      success: true,
      data: emprendimiento,
    });
  },
);

export const actualizarEmprendimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = emprendimientoIdSchema.parse(
      req.validated?.params,
    );
    const data = actualizarEmprendimientoSchema.parse(
      req.validated?.body,
    );
    const usuarioId = req.usuario!.id_usuario;

    const emprendimiento =
      await emprendimientoService.actualizarEmprendimiento(
        params.id,
        usuarioId,
        data,
      );

    res.status(200).json({
      success: true,
      data: emprendimiento,
    });
  },
);

export const cambiarEstadoEmprendimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = emprendimientoIdSchema.parse(
      req.validated?.params,
    );
    const data = cambiarEstadoEmprendimientoSchema.parse(
      req.validated?.body,
    );
    const usuarioId = req.usuario!.id_usuario;

    const emprendimiento =
      await emprendimientoService.cambiarEstadoEmprendimiento(
        params.id,
        usuarioId,
        data.activo,
      );

    res.status(200).json({
      success: true,
      data: emprendimiento,
    });
  },
);

export const eliminarEmprendimientoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = emprendimientoIdSchema.parse(
      req.validated?.params,
    );
    const usuarioId = req.usuario!.id_usuario;

    const resultado =
      await emprendimientoService.eliminarEmprendimiento(
        params.id,
        usuarioId,
      );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);
