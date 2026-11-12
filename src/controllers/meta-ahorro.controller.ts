import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import {
  metaAhorroIdSchema,
  aporteMetaParamsSchema,
  listarMetasAhorroSchema,
  crearMetaAhorroSchema,
  actualizarMetaAhorroSchema,
  crearAporteMetaSchema,
  actualizarAporteMetaSchema,
} from "../schemas/meta-ahorro.schema";
import * as metaAhorroService from "../services/meta-ahorro.service";

export const listarMetasAhorroController = asyncHandler(
  async (req: Request, res: Response) => {
    const filtros = listarMetasAhorroSchema.parse(req.validated?.query);

    const resultado = await metaAhorroService.listarMetasAhorro(
      req.usuario!.id_usuario,
      filtros,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const obtenerMetaAhorroController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = metaAhorroIdSchema.parse(req.validated?.params);

    const resultado = await metaAhorroService.obtenerMetaAhorro(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const crearMetaAhorroController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = crearMetaAhorroSchema.parse(req.validated?.body);

    const resultado = await metaAhorroService.crearMetaAhorro(
      req.usuario!.id_usuario,
      data,
    );

    res.status(201).json({ success: true, data: resultado });
  },
);

export const actualizarMetaAhorroController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = metaAhorroIdSchema.parse(req.validated?.params);
    const data = actualizarMetaAhorroSchema.parse(req.validated?.body);

    const resultado = await metaAhorroService.actualizarMetaAhorro(
      params.id,
      req.usuario!.id_usuario,
      data,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const eliminarMetaAhorroController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = metaAhorroIdSchema.parse(req.validated?.params);

    const resultado = await metaAhorroService.eliminarMetaAhorro(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const cancelarMetaAhorroController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = metaAhorroIdSchema.parse(req.validated?.params);

    const resultado = await metaAhorroService.cancelarMetaAhorro(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const listarAportesMetaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = metaAhorroIdSchema.parse(req.validated?.params);

    const resultado = await metaAhorroService.listarAportesMeta(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const crearAporteMetaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = metaAhorroIdSchema.parse(req.validated?.params);
    const data = crearAporteMetaSchema.parse(req.validated?.body);

    const resultado = await metaAhorroService.crearAporteMeta(
      params.id,
      req.usuario!.id_usuario,
      data,
    );

    res.status(201).json({ success: true, data: resultado });
  },
);

export const actualizarAporteMetaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = aporteMetaParamsSchema.parse(req.validated?.params);
    const data = actualizarAporteMetaSchema.parse(req.validated?.body);

    const resultado = await metaAhorroService.actualizarAporteMeta(
      params.id,
      params.idAporte,
      req.usuario!.id_usuario,
      data,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const eliminarAporteMetaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = aporteMetaParamsSchema.parse(req.validated?.params);

    const resultado = await metaAhorroService.eliminarAporteMeta(
      params.id,
      params.idAporte,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);
