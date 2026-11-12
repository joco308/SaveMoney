import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import {
  presupuestoIdSchema,
  presupuestoCategoriaParamsSchema,
  listarPresupuestosSchema,
  crearPresupuestoSchema,
  actualizarPresupuestoSchema,
  crearPresupuestoCategoriaSchema,
  actualizarPresupuestoCategoriaSchema,
} from "../schemas/presupuesto.schema";
import * as presupuestoService from "../services/presupuesto.service";

export const listarPresupuestosController = asyncHandler(
  async (req: Request, res: Response) => {
    const filtros = listarPresupuestosSchema.parse(req.validated?.query);

    const resultado = await presupuestoService.listarPresupuestos(
      req.usuario!.id_usuario,
      filtros,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const obtenerPresupuestoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = presupuestoIdSchema.parse(req.validated?.params);

    const resultado = await presupuestoService.obtenerPresupuesto(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const crearPresupuestoController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = crearPresupuestoSchema.parse(req.validated?.body);

    const resultado = await presupuestoService.crearPresupuesto(
      req.usuario!.id_usuario,
      data,
    );

    res.status(201).json({ success: true, data: resultado });
  },
);

export const actualizarPresupuestoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = presupuestoIdSchema.parse(req.validated?.params);
    const data = actualizarPresupuestoSchema.parse(req.validated?.body);

    const resultado = await presupuestoService.actualizarPresupuesto(
      params.id,
      req.usuario!.id_usuario,
      data,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const eliminarPresupuestoController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = presupuestoIdSchema.parse(req.validated?.params);

    const resultado = await presupuestoService.eliminarPresupuesto(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const agregarLimiteCategoriaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = presupuestoIdSchema.parse(req.validated?.params);
    const data = crearPresupuestoCategoriaSchema.parse(
      req.validated?.body,
    );

    const resultado = await presupuestoService.agregarLimiteCategoria(
      params.id,
      req.usuario!.id_usuario,
      data,
    );

    res.status(201).json({ success: true, data: resultado });
  },
);

export const actualizarLimiteCategoriaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = presupuestoCategoriaParamsSchema.parse(
      req.validated?.params,
    );
    const data = actualizarPresupuestoCategoriaSchema.parse(
      req.validated?.body,
    );

    const resultado =
      await presupuestoService.actualizarLimiteCategoria(
        params.id,
        params.idLimite,
        req.usuario!.id_usuario,
        data,
      );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const eliminarLimiteCategoriaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = presupuestoCategoriaParamsSchema.parse(
      req.validated?.params,
    );

    const resultado =
      await presupuestoService.eliminarLimiteCategoria(
        params.id,
        params.idLimite,
        req.usuario!.id_usuario,
      );

    res.status(200).json({ success: true, data: resultado });
  },
);
