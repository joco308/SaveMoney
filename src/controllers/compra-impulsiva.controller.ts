import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import {
  compraImpulsivaIdSchema,
  listarComprasImpulsivasSchema,
  crearCompraImpulsivaSchema,
  actualizarCompraImpulsivaSchema,
  comprarCompraImpulsivaSchema,
} from "../schemas/compra-impulsiva.schema";
import * as compraService from "../services/compra-impulsiva.service";

export const listarComprasImpulsivasController = asyncHandler(
  async (req: Request, res: Response) => {
    const filtros = listarComprasImpulsivasSchema.parse(req.validated?.query);

    const resultado = await compraService.listarComprasImpulsivas(
      req.usuario!.id_usuario,
      filtros,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);

export const obtenerCompraImpulsivaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = compraImpulsivaIdSchema.parse(req.validated?.params);

    const compra = await compraService.obtenerCompraImpulsiva(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: compra });
  },
);

export const crearCompraImpulsivaController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = crearCompraImpulsivaSchema.parse(req.validated?.body);

    const compra = await compraService.crearCompraImpulsiva(
      req.usuario!.id_usuario,
      data,
    );

    res.status(201).json({ success: true, data: compra });
  },
);

export const actualizarCompraImpulsivaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = compraImpulsivaIdSchema.parse(req.validated?.params);
    const data = actualizarCompraImpulsivaSchema.parse(req.validated?.body);

    const compra = await compraService.actualizarCompraImpulsiva(
      params.id,
      req.usuario!.id_usuario,
      data,
    );

    res.status(200).json({ success: true, data: compra });
  },
);

export const comprarCompraImpulsivaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = compraImpulsivaIdSchema.parse(req.validated?.params);
    const data = comprarCompraImpulsivaSchema.parse(req.validated?.body);

    const compra = await compraService.comprarCompraImpulsiva(
      params.id,
      req.usuario!.id_usuario,
      data,
    );

    res.status(200).json({ success: true, data: compra });
  },
);

export const descartarCompraImpulsivaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = compraImpulsivaIdSchema.parse(req.validated?.params);

    const compra = await compraService.descartarCompraImpulsiva(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: compra });
  },
);

export const eliminarCompraImpulsivaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = compraImpulsivaIdSchema.parse(req.validated?.params);

    const resultado = await compraService.eliminarCompraImpulsiva(
      params.id,
      req.usuario!.id_usuario,
    );

    res.status(200).json({ success: true, data: resultado });
  },
);
